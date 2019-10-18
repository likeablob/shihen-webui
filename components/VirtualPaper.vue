<template lang="pug">
.container()
  canvas(ref="canvas" :width="width" :height="height")
</template>

<script>
import _ from 'lodash'
import Dither from 'canvas-dither'

export default {
  props: {
    text: {
      type: String,
      default: '',
    },
    bgColor: {
      type: String,
      default: 'white',
    },
    textColor: {
      type: String,
      default: 'black',
    },
    fontFamily: {
      type: String,
      default: 'Sawarabi Mincho',
    },
  },
  data() {
    return {
      width: 296,
      height: 128,
      fontSize: 10,
      canvas: null,
    }
  },
  computed: {
    paddedWidth() {
      return this.width - 30
    },
    paddedHeight() {
      return this.height - 10
    },
    rows() {
      return this.text.split('||')
    },
  },
  watch: {
    rows() {
      this.draw()
    },
  },
  mounted() {
    const observer = new IntersectionObserver(entries => {
      // Use `intersectionRatio` because of Edge 15's
      // lack of support for `isIntersecting`.
      // See: https://github.com/w3c/IntersectionObserver/issues/211
      if (entries[0].intersectionRatio <= 0) return

      // console.log('intersected', this.text)
      observer.unobserve(this.$el)
      this.draw()
      this.$watch(
        vm => [vm.bgColor, vm.fontFamily].join(),
        val => {
          this.draw()
        }
      )
    })
    // We observe the root `$el` of the
    // mounted loading component to detect
    // when it becomes visible.
    observer.observe(this.$el)

    this.canvas = this.$refs.canvas
  },
  methods: {
    draw() {
      const ctx = this.canvas.getContext('2d')
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = this.bgColor
      ctx.fillRect(0, 0, this.width, this.height)

      ctx.font = `${this.fontSize}px ${this.fontFamily}`

      const textWidth = _(this.rows)
        .map(row => {
          const metrics = ctx.measureText(row)
          return metrics.width
        })
        .max()

      const rowLen = this.rows.length
      const fontSize = _.max([
        _.min([
          this.fontSize * (this.paddedWidth / textWidth),
          this.paddedHeight / rowLen,
        ]),
        10,
      ])
      // console.log('new fontSize', fontSize)
      // console.log(this.rows)
      ctx.font = `bold ${fontSize}px ${this.fontFamily}`
      this.fontSize = fontSize
      ctx.fillStyle = this.textColor
      // const x = _.max([0, (this.width - metrics.width) / 2])
      this.rows.forEach((row, i) => {
        ctx.fillText(
          row,
          this.width / 2,
          this.height / 2 + (i - (rowLen - 1) / 2) * fontSize
        )
      })

      const image = ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      )

      // dithering
      // image = Dither.atkinson(image)

      // redraw
      ctx.putImageData(image, 0, 0)
    },
    getCanvas() {
      return this.canvas
    },
    toDataURL() {
      const dataUrl = this.canvas.toDataURL()
      console.log(this.canvas, dataUrl)
      return dataUrl
    },
    getBinaryArray() {
      const imageData = this.canvas
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
.container {
  border: solid 1px #90a4ae;
  width: 296px;
  height: 128px;
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
  margin: 10px 0px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  overflow: hidden;
}
</style>
