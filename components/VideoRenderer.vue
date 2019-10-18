<template lang="pug">
.renderer-wrapper(v-show="false")
    video(
      preload
      crossorigin
      ref="renderVideo"
      @canplay="emitEvent"
      @loadeddata="emitEvent"
      @seeked="emitEvent"
      :src="src"
    )
    canvas(ref="videoCanvas" :width="width" :height="height")
</template>

<script>
import _ from 'lodash'
import Dither from 'canvas-dither'

export default {
  props: {
    src: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      width: 296,
      height: 128,
      isLoaded: false,
    }
  },
  watch: {
    src(next, prev) {
      console.log('src changed', next, prev)
      this.$emit('cancelWaiting', 'src changed')
      this.isLoaded = false
    },
  },
  mounted() {
    this.$on('renderVideo', ev => {
      console.log('@on', ev)
      if (ev.type === 'canplay') {
        this.isLoaded = true
      }
    })
  },
  beforeDestroy() {
    this.$emit('cancelWaiting', 'beforeDestroy')
  },
  methods: {
    emitEvent(ev) {
      console.log('@ev', ev)
      this.$emit('renderVideo', ev)
    },
    waitEvent(type) {
      return new Promise((resolve, reject) => {
        const resolver = ev => {
          if (ev.type === type) {
            resolve(ev)
            this.$off('renderVideo', resolver)
          }
        }
        this.$on('renderVideo', resolver)
        this.$once('cancelWaiting', ev => {
          reject(new Error(ev))
        })
      })
    },
    async waitLoaded() {
      console.log('waitLoaded', this.isLoaded)

      if (this.isLoaded) return
      await this.waitEvent('canplay')
    },
    async render(pos, filter) {
      console.log('@render')

      await this.waitLoaded()
      const video = this.$refs.renderVideo
      video.currentTime = pos
      await this.waitEvent('seeked')
      await this.waitEvent('canplay')

      const canvas = this.$refs.videoCanvas
      const ctx = canvas.getContext('2d')

      // apply filters
      filter = {
        brightness: 100,
        contrast: 100,
        grayscale: 0,
        ...filter,
      }
      const filterStr = [
        `brightness(${Math.floor(filter.brightness)}%)`,
        `contrast(${Math.floor(filter.contrast)}%)`,
        `grayscale(${Math.floor(filter.grayscale)}%)`,
      ].join(' ')
      ctx.filter = filterStr

      // copy the frame into the canvas with Y cropping & scaling
      const videoRatio = video.videoHeight / video.videoWidth
      const drawHeight = canvas.width * videoRatio
      ctx.drawImage(
        video,
        0,
        -(drawHeight - canvas.height) / 2,
        canvas.width,
        drawHeight
      )
      let image = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // dithering
      image = Dither.atkinson(image)

      // redraw
      ctx.putImageData(image, 0, 0)
    },
    async getAsImage(...args) {
      await this.render(...args)
      return this.$refs.videoCanvas.toDataURL()
    },
    async getAsBinaryArray(...args) {
      await this.render(...args)
      const imageData = this.$refs.videoCanvas
        .getContext('2d')
        .getImageData(0, 0, this.width, this.height)

      return new Uint8ClampedArray(
        _(imageData.data)
          .chunk(4)
          .map(v => {
            // convert to B/W
            return _.mean(v.slice(0, 3)) < 128
          })
          .chunk(8)
          .map(v => {
            // reduce to 1byte
            return v.reduce((p, c, i) => {
              const bit = c ? 1 : 0
              return p | (bit << (7 - i))
            }, 0)
          })
          .values()
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.renderer-wrapper {
  width: 296px;
  height: 128px;
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 1px;
  }
}
</style>
