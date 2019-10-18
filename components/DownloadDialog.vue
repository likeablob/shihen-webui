<template lang="pug">
v-dialog(v-model='dialog' persistent max-width='500')
  template(v-slot:activator='{ on }')
    v-btn(v-on='on' block outlined @click="build") For Device
  v-card
    v-toolbar(flat dark color="primary")
      v-icon.pr-2 mdi-download
      v-toolbar-title.headline Processing - {{progress.toFixed(1)}}% ({{currentPage}}/{{pages.length}})
    .text-xs-center.px-2.py-3
      v-progress-linear(v-model="Math.round(progress)" background-color="blue-grey lighten-2" color="blue-grey darken-3")
    v-card-actions
      v-spacer
      v-btn(color='accent darken-1' text @click='download' :disabled="!bins") Download ({{(size/1024).toFixed(1)}}KiB)
      v-btn(color='accent darken-1' text @click='onCancelDownload') Cancel
  .render-wrapper(v-show="false")
    div(ref="render")
</template>

<script>
import _ from 'lodash'
import Vue from 'vue'
import pako from 'pako'
import { mapState } from 'vuex'

import VirtualPaper from '@/components/VirtualPaper'

export default {
  components: {
    VirtualPaper,
  },
  data() {
    return {
      dialog: false,
      currentPage: 0,
      cancelDownload: false,
      isProcessing: false,
      bins: null,
      offsets: null,
      size: 0,
    }
  },
  computed: {
    ...mapState(['pages']),
    progress() {
      return (this.currentPage / this.pages.length) * 100
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
    async build() {
      this.isProcessing = true
      this.bins = this.offsets = null
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
      const toBinary = text => {
        const ComponentClass = Vue.extend(VirtualPaper)
        const instance = new ComponentClass({
          propsData: { text },
          el: this.$refs.render,
        })
        // await nextTick()

        instance.draw()
        const arr = instance.getBinaryArray()
        instance.$destroy()
        return arr
      }

      await nextTick()
      // TODO: impl as Web Worker
      const bins = await this.pages
        .map((text, i) => {
          return async arr => {
            if (this.cancelDownload) {
              return Promise.reject(new Error('Canceled'))
            }
            const bin = await toBinary(text)
            await psleep(1) // for animation
            this.currentPage = i + 1
            const gzBin = pako.gzip(bin)
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
        _(bins)
          .map(v => v.length)
          .mean()
      )

      this.bins = bins
      this.offsets = offsets
      this.isProcessing = false
      this.cancelDownload = false
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
