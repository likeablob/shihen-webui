<template lang="pug">
v-layout()
  .image-flex.fill-height()
    .progress-wrapper()
      v-progress-linear(:value="images.length/previewNum*100" v-if="isPreviewProcessing")
    v-layout.image-wrapper.py-3(fill-height align-center column)
      div.mb-4(v-for="img in images")
        v-chip(label small) {{formatDuration(img.time)}}
        virtual-paper-image(:src="img.data")
      virtual-paper(v-if="!videoURL" text="Preview Area")
  .code-flex.fill-height()
    v-container.codeflex-container.pl-1.pt-1
      v-card(flat)
        .preview-video-wrapper()
          video(
            preload
            crossorigin
            :src="videoURL"
            ref="video"
            :poster="videoURL ? '' : 'https://picsum.photos/720/400'"
            @loadeddata="onVideoEvent"
            @loadedmetadata="onVideoEvent"
            @canplay="onVideoEvent"
            @seeked="onVideoEvent"
          )
          .preview-text(v-if="!videoURL")
            pre.display-1 Please Select Your Video File
        v-card-text.pb-0()
          v-file-input(
            label="File input"
            accept="video/*"
            @change="onFileChange"
            :truncate-length="32"
            filled
            autofocus
            show-size
            prepend-icon="mdi-file-video"
          )
        v-subheader Preview position
        v-card-text()
          v-slider.slider-timetick(
            thumb-label="always"
            :step="captureInterval"
            v-model="previewStartPos"
            :max="videoDuration"
            :min="0"
            hide-details
            :disabled="!videoURL"
            prepend-icon="mdi-eye"
          )
            template(v-slot:thumb-label="{value}")
              div {{formatDuration(value)}}

        v-subheader Capture range
        v-card-text.py-0()
          v-range-slider.slider-timetick(
            thumb-label
            :step="captureInterval"
            v-model="captureRange"
            :max="videoDuration"
            :disabled="!videoURL"
            prepend-icon="mdi-image-multiple"
          )
            template(v-slot:thumb-label="{value}")
              div {{formatDuration(value)}}
      video-renderer(
        :src="videoURL"
        ref="videoRenderer"
      )
  .setting-flex.fill-height()
    v-container.px-0.py-0.mt-1(grid-list-lg fill-height)
      v-layout(fill-height column)
        v-card(outlined tile )
          v-toolbar(flat color="grey lighten-4")
            span
              v-icon.pr-1(small) mdi-information
              | Misc
          v-card-text
            v-flex()
              span.primary--text Total {{pageNum}} pages / approx. {{(pageNum*2.8).toFixed(1)}} KiB
        v-card.mt-1(outlined tile height="100%")
          v-toolbar(flat color="grey lighten-4")
            v-icon.pr-1(small) mdi-settings
            | Settings
          v-card-text
            v-text-field(
              label="Capture start"
              placeholder="00:00:00"
              v-model="captureRange[0]"
              :suffix="`sec (${formatDuration(captureRange[0])})`"
              type="number"
              :min="0"
              :max="videoDuration"
            )
            v-text-field(
              label="Capture end"
              placeholder="00:00:00"
              v-model="captureRange[1]"
              :suffix="`sec (${formatDuration(captureRange[1])})`"
              type="number"
              :min="0"
              :max="videoDuration"
            )
            v-text-field(
              label="Capture interval"
              placeholder="1"
              v-model="captureInterval"
              suffix="sec"
              type="number"
              :min="1"
            )
            v-select(
              label="Number of preview images"
              :items="[1, 3, 5, 10, 20, 50]"
              v-model="previewNum"
            )
            v-slider(
              thumb-label
              label="Brightness"
              :max="200"
              :min="0"
              append-icon="mdi-close-box"
              @click:append="videoFilter.brightness=100"
              v-model="videoFilter.brightness"
            )
            v-slider(
              thumb-label
              label="Contrast"
              :max="200"
              :min="0"
              append-icon="mdi-close-box"
              @click:append="videoFilter.contrast=100"
              v-model="videoFilter.contrast"
            )
        v-card.mt-1(outlined tile)
          v-toolbar(flat color="grey lighten-4")
            span
              v-icon.pr-1(small) mdi-download
              | Download
          v-card-text
            v-layout(column)
              download-dialog-video(
                :url="videoURL"
                :range="captureRange"
                :interval="Number(captureInterval)"
                :filter="videoFilter"
              )
              v-btn.mt-2(block outlined disabled) for PC
</template>

<script>
import _ from 'lodash'
import moment from 'moment'
import 'moment-duration-format'
import { mapState } from 'vuex'
import colors from 'vuetify/lib/util/colors'

import VirtualPaper from '@/components/VirtualPaper'
import VirtualPaperImage from '@/components/VirtualPaperImage'
import DownloadDialogVideo from '@/components/DownloadDialogVideo'
import VideoRenderer from '@/components/VideoRenderer'

const bgColors = [
  {
    text: 'White',
    value: 'white',
  },
  {
    text: 'Yellow',
    value: colors.yellow.lighten2,
  },
  {
    text: 'Red',
    value: colors.red.lighten2,
  },
]

class CancelableQueue {
  constructor() {
    this.chain = Promise.resolve()
    this.queue = []
  }

  push(fn) {
    const task = {
      isCanceled: false,
    }
    this.queue.push(task)
    this.chain = this.chain
      .then(() => fn(task))
      .catch(err => {
        console.error(err)
      })
  }

  cancelAll() {
    this.queue.forEach(v => (v.isCanceled = true))
    this.queue = []
  }
}

const previewQueue = new CancelableQueue()

export default {
  // layout: 'video',
  middleware: [],
  components: {
    VirtualPaper,
    VirtualPaperImage,
    DownloadDialogVideo,
    VideoRenderer,
  },
  data() {
    return {
      bgColors,
      config: {
        color: _.first(bgColors).value,
      },
      cmOptions: {
        tabSize: 4,
        mode: 'simplemode',
        theme: 'idea fill-height',
        lineNumbers: true,
        line: true,
        styleActiveLine: true,
        lineWrapping: true,
      },
      previewStartPos: 0,
      captureRange: [0, 100],
      captureInterval: 2,
      previewNum: 5,
      videoURL: null,
      images: [],
      videoDuration: 0,
      actualPreviewNum: 5,
      isPreviewProcessing: false,
      videoFilter: {
        brightness: 100,
        contrast: 100,
      },
    }
  },
  computed: {
    ...mapState([]),
    pageNum() {
      return Math.ceil(
        (this.captureRange[1] - this.captureRange[0] + 1) / this.captureInterval
      )
    },
  },
  watch: {
    captureInterval(v) {
      this.reloadPreview()
    },
    previewNum(v) {
      this.reloadPreview()
    },
    previewStartPos(v) {
      // const pos = _.max([this.captureRange[0], v])
      this.$refs.video.currentTime = v
    },
    captureRange([start, end]) {
      // previewStartPos should be within captureRange
      this.previewStartPos = _.max([start, _.min([this.previewStartPos, end])])
    },
    videoDuration(v) {
      this.captureRange = [0, v]
    },
    videoFilter: {
      deep: true,
      handler() {
        this.reloadPreview()
      },
    },
  },
  mounted() {
    // this.videoURL = '/demovideo.mp4'
  },
  methods: {
    formatDuration(sec) {
      return moment.duration(sec, 's').format('hh:mm:ss', { trim: false })
    },
    onFileChange(e) {
      console.log('@onFileChange', e)
      if (!e) return
      const url = URL.createObjectURL(e)
      this.videoURL = url
      this.previewStartPos = 0
    },
    reloadPreview() {
      this.loadFrames(
        this.previewStartPos,
        this.captureInterval,
        this.previewNum
      )
    },
    loadFrames(from, step, num) {
      console.log('@loadFrames')

      previewQueue.cancelAll() // cancel previous tasks

      previewQueue.push(task => {
        return Promise.resolve()
          .then(async () => {
            console.log('task started')
            this.images = []
            this.isPreviewProcessing = true
            for (const i of _.range(num)) {
              const newPos = from + i * step
              if (newPos > this.videoDuration || task.isCanceled) {
                break
              }
              const data = await this.$refs.videoRenderer.getAsImage(
                newPos,
                this.videoFilter
              )

              if (!data || task.isCanceled) {
                break
              }
              this.images = this.images.concat({
                time: newPos,
                data,
              })
            }
            this.isPreviewProcessing = false
          })
          .catch(err => {
            console.error(err)
            console.log('task canceled')
          })
      })
    },
    onVideoEvent(e) {
      console.log('onVideoEvent', e)
      if (e.type === 'loadedmetadata') {
        this.videoDuration = this.$refs.video.duration
      }
      if (e.type === 'canplay') {
        this.reloadPreview()
      }
    },
    mounted() {},
  },
}
</script>

<style media="screen" lang="scss">
.code-flex {
  flex: 1 1 100%;
  background-color: white;
  overflow: auto;
}

.codeflex-container {
  max-width: 800px;
}

.image-flex {
  background-color: white;
  width: 350px;
  flex: 0 0 auto;
  overflow-y: scroll;
  position: relative;

  .progress-wrapper {
    position: absolute;
    bottom: 0;
    margin: 0;
    padding: 0;
    font-size: 15pt;
    color: red;
    width: 100%;
    div {
      margin: 0;
    }
  }
}

.setting-flex {
  flex: 0 0 320px;
  // overflow-y: auto;
}

.image-wrapper {
  overflow: auto;
}

.preview-video-wrapper {
  width: 100%;
  height: auto;
  position: relative;
  display: grid;
  video {
    width: 100%;
    height: auto;
    max-height: 50vh;
    object-fit: cover;
    border-radius: 1px;
  }
  .preview-text {
    display: flex;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
    pre {
      color: white;
    }
  }
}

.slider-timetick {
  .v-slider__thumb-label {
    border-radius: 10% 10%;
    height: auto !important;
    width: auto !important;
    transform: translateY(-20%) translateY(-12px) translateX(-50%) rotate(0deg) !important;
    div {
      transform: rotate(0deg);
      padding: 1px 3px;
    }
  }
}
</style>
