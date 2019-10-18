<template lang="pug">
v-layout()
  .image-flex.fill-height()
    v-layout.image-wrapper.py-3(fill-height align-center column)
      template(v-for="item in (previewAll ? pages : pages.slice(0,100))")
        virtual-paper(ref="p" :text="item" :bg-color="config.color" :fontFamily="config.font")
  .code-flex.fill-height.pr-1()
    no-ssr(placeholder='Loading...')
      codemirror.codemirror(
        ref='cm'
        v-model='src'
        :options='cmOptions'
        @ready=''
        @focus='onCmFocus'
        @input='')
  .setting-flex.fill-height()
    v-container.px-0.py-0.mt-1(grid-list-lg fill-height)
      v-layout(fill-height column)
        v-card(outlined tile)
          v-toolbar(flat color="grey lighten-4")
            span
              v-icon.pr-1(small) mdi-information
              | Misc
          v-card-text
            v-flex
              span.primary--text Total {{pages.length}} pages / approx. {{(pages.length*0.76).toFixed(1)}} KiB
        v-card.mt-1(outlined tile height="100%")
          v-toolbar(flat color="grey lighten-4")
            v-icon.pr-1(small) mdi-settings
            | Settings
          v-card-text
            v-select(
              label='Font'
              :items='fonts'
              v-model="selectedFont"
              :loading="isLoadingFont"
              return-object
            )
            v-select(
              label='Background Color'
              :items='bgColors'
              v-model="config.color"
            )
            v-btn.mt-3(@click="shufflePages" block outlined) Shuffle Lines
            v-btn.mt-3(block outlined disabled) Auto Format
            v-switch(
              label="Preview all (requires horse power)"
              v-model="previewAll"
            )
        v-card.mt-1(outlined tile)
          v-toolbar(flat color="grey lighten-4")
            span
              v-icon.pr-1(small) mdi-download
              | Download
          v-card-text
            v-layout(column)
              download-dialog
              v-btn.mt-2(block outlined disabled) for PC
  canvas(ref="canvas" v-show="false" width="300" height="128")
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import { codemirror } from 'vue-codemirror'
import colors from 'vuetify/lib/util/colors'
import FontFaceObserver from 'fontfaceobserver'

import VirtualPaper from '@/components/VirtualPaper'
import DownloadDialog from '@/components/DownloadDialog'

const fonts = [
  {
    text: 'Sawarabi Mincho',
    url: '//fonts.googleapis.com/earlyaccess/sawarabimincho.css',
  },
  {
    text: 'Noto Serif JP',
    url: '//fonts.googleapis.com/css?family=Noto+Serif+JP',
  },
  {
    text: 'M PLUS 1p',
    url: '//fonts.googleapis.com/css?family=M+PLUS+1p&subset=japanese',
  },
  {
    text: 'Noto Serif SC',
    url: '//fonts.googleapis.com/css?family=Noto+Serif+SC',
  },
]

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

export default {
  middleware: [],
  components: {
    codemirror,
    VirtualPaper,
    DownloadDialog,
  },
  data() {
    return {
      bgColors,
      fonts,
      config: {
        color: _.first(bgColors).value,
        font: 'sans',
      },
      selectedFont: null,
      isLoadingFont: false,
      previewAll: false,
      cmOptions: {
        tabSize: 4,
        mode: 'simplemode',
        theme: 'idea fill-height',
        lineNumbers: true,
        line: true,
        styleActiveLine: true,
        lineWrapping: true,
      },
    }
  },
  computed: {
    ...mapState(['pages']),
    src: {
      get() {
        return this.$store.state.pages.join('\n')
      },
      set(value) {
        return this.$store.commit('setPages', value.split('\n'))
      },
    },
    reversePos: {
      get() {
        return this.$store.state.reversePos
      },
      set(value) {
        return this.$store.commit('setReversePos', value)
      },
    },
  },
  watch: {
    selectedFont(v) {
      this.isLoadingFont = true
      new FontFaceObserver(v.text, {}).load().then(res => {
        console.log('loaded', res)
        this.config.font = v.text
        this.isLoadingFont = false
      })
      const cssFont = document.createElement('link')
      cssFont.href = v.url
      cssFont.rel = 'stylesheet'
      document.head.appendChild(cssFont)
    },
  },
  mounted() {
    this.selectedFont = _.first(fonts)
  },
  methods: {
    shufflePages() {
      return this.$store.commit('shufflePages')
    },
    onCmFocus(cm) {},
  },
}
</script>

<style media="screen" lang="scss">
.code-flex {
  flex: 1 1 100%;
  background-color: white;
  overflow: auto;
}

.image-flex {
  background-color: white;
  width: 340px;
  flex: 0 0 auto;
  overflow-y: scroll;
}

.setting-flex {
  flex: 0 0 320px;
  // overflow-y: auto;
}

.image-wrapper {
  overflow: auto;
}

.codemirror {
  height: 100%;
  width: 100%;
  overflow: auto;
}

.cm-s-fill-height {
  height: 100%;
  min-width: 1%;
}
</style>
