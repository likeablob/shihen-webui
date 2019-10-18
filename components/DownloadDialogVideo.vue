<template lang="pug">
v-dialog(v-model='dialog' persistent max-width='500')
  template(v-slot:activator='{ on }')
    v-btn(v-on='on' block outlined @click="generate") For Device
  v-card
    v-toolbar(flat dark color="primary")
      v-icon.pr-2 mdi-download
      v-toolbar-title.headline Processing - {{progress.toFixed(1)}}% ({{currentPage}}/{{pageNum}})
    .text-xs-center.px-2.py-3
      v-progress-linear(v-model="Math.round(progress)" background-color="blue-grey lighten-2" color="blue-grey darken-3")
    v-card-actions
      v-spacer
      v-btn(color='accent darken-1' text @click='download' :disabled="!bins") Download ({{(size/1024).toFixed(1)}}KiB)
      v-btn(color='accent darken-1' text @click='onCancelDownload') Cancel
    video-renderer(
      :src="url"
      ref="videoRenderer"
    )
</template>

<script>
import _ from 'lodash'
import pako from 'pako'

import VideoRenderer from '@/components/VideoRenderer'

export default {
  components: {
    VideoRenderer,
  },
  props: {
    url: {
      type: String,
      default: '',
    },
    range: {
      type: Array,
      default: () => [0, 0],
    },
    interval: {
      type: Number,
      default: 1,
    },
    filter: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      dialog: false,
      cancelDownload: false,
      isProcessing: false,
      bins: null,
      offsets: null,
      size: 0,
      currentPage: 0,
    }
  },
  computed: {
    progress() {
      return (this.currentPage / this.pageNum) * 100
    },
    pageNum() {
      return Math.ceil((this.range[1] - this.range[0] + 1) / this.interval)
    },
  },
  watch: {},
  methods: {
    onCancelDownload() {
      this.dialog = false
      if (this.isProcessing) {
        this.cancelDownload = true
      }
    },
    async generate() {
      console.log('@generate')
      this.bins = this.offsets = null
      this.isProcessing = true
      this.currentPage = 0
      this.size = 0
      const nextTick = () => {
        return new Promise(resolve => {
          this.$nextTick(resolve)
        })
      }
      const psleep = ms => {
        return new Promise(resolve => {
          setTimeout(resolve, ms)
        })
      }

      // TODO: impl as Web Worker
      const bins = await _.range(
        this.range[0],
        this.range[1] + 1,
        this.interval
      )
        .map((pos, i) => {
          return async arr => {
            if (this.cancelDownload) {
              return Promise.reject(new Error('Canceled'))
            }
            await nextTick()
            await psleep(1) // for animation
            const bin = await this.$refs.videoRenderer.getAsBinaryArray(
              pos,
              this.filter
            )
            const gzBin = pako.gzip(bin, {
              level: 9,
            })
            this.currentPage = i + 1
            this.size += gzBin.length
            return [...arr, gzBin]
          }
        })
        .reduce((p, c) => {
          return p.then(c)
        }, Promise.resolve([]))
        .catch(e => {
          console.error(e)
        })

      if (this.cancelDownload || !bins) {
        this.isProcessing = this.dialog = this.cancelDownload = false
        await nextTick()
        this.currentPage = 0
        return
      }

      const offsets = _(
        bins.reduce(
          (p, c) => {
            const pos = _.last(p)
            return p.concat(pos + c.length)
          },
          [0]
        )
      )
        .drop()
        .dropRight()
        .value()

      console.log(
        'average size',
        _(bins)
          .map(v => v.length)
          .mean()
      )

      this.bins = bins
      this.offsets = offsets
      this.isProcessing = this.cancelDownload = false
    },
    download() {
      const download = (filename, blob) => {
        const a = document.createElement('a')
        a.download = filename
        a.href = URL.createObjectURL(blob)
        a.click()
      }

      download(
        'images.bin',
        new Blob(_.concat(this.bins), {
          type: 'application/octet-stream',
        })
      )
      download(
        'offsets.bin',
        new Blob([new Uint32Array(this.offsets)], {
          type: 'application/octet-stream',
        })
      )
      this.isProcessing = this.dialog = false
      this.bins = this.offsets = null
    },
  },
}
</script>

<style lang="scss"></style>
