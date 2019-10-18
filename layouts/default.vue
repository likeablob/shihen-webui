<template lang="pug">
v-app()
  app-bar
    template(v-slot:center v-if="$route.name === 'index'")
      v-autocomplete.pt-0(
        hide-details
        prepend-icon="mdi-magnify"
        placeholder="Add from presets"
        :items="presets"
        v-model="presetText"
        :loading="presetLoading"
        :value="presetText"
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
import presets from '@/assets/presets'

export default {
  components: {
    AppBar,
    AppDrawer,
  },
  data() {
    return {
      presetText: '',
      presetLoading: false,
      presets,
    }
  },
  computed: {},
  watch: {
    presetText(v) {
      if (v) {
        this.presetLoading = true
        this.$axios.get(v).then(res => {
          this.$store.commit('setPages', res.data)
          this.presetLoading = false
          this.presetText = ''
        })
      }
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
