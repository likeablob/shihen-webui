<template lang="pug">
v-app()
  app-bar
    template(v-slot:center v-if="$route.name === 'index'")
      v-autocomplete.pt-0(
        hide-details
        prepend-icon="mdi-magnify"
        placeholder="Add from presets"
        :items="presets"
        item-value="value"
        item-text="title"
        return-object
        v-model="preset"
        :loading="presetLoading"
        :disabled="presetLoading"
      )
      v-tooltip(bottom v-if="false")
        template(v-slot:activator="{ on }")
          v-btn.mx-2(outlined small v-on="on" href="https://github.com/likeablob/shihen" target="_blank") PR
        span Create PullRequest to add presets!
  app-drawer
  v-content
    v-container.container(fluid fill-height)
      nuxt
</template>
<script>
import AppBar from '@/components/AppBar'
import AppDrawer from '@/components/AppDrawer'

export default {
  components: {
    AppBar,
    AppDrawer,
  },
  data() {
    return {
      preset: undefined,
      presetLoading: false,
      presets: [],
    }
  },
  computed: {},
  watch: {
    preset(v) {
      if (v) {
        this.presetLoading = true
        this.$axios.get(v.path).then(res => {
          this.$store.commit('setPages', res.data.data)
          this.presetLoading = false
          this.preset = undefined
        })
      }
    },
  },
  mounted() {
    this.fetchPresets()
  },
  methods: {
    fetchPresets() {
      this.presetLoading = true
      this.$axios.get('/_nuxt/presets.json').then(({ data }) => {
        this.presets = data
        this.presetLoading = false
      })
    },
  },
}
</script>

<style media="screen" lang="scss" scoped>
.container {
  max-height: calc(100vh - 56px);
  overflow: hidden;
  padding: 0;
}
</style>
