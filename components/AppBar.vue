<template lang="pug">
  v-app-bar.appbar(app flat color="secondary" fixed :height="56")
    v-toolbar-title.title.blue-grey--text.text--darken-4 SHIHEN
    v-spacer
    slot(name="center")
    v-spacer
    v-flex(xs1)
      v-select.pt-0(
        hide-details
        :items='["EN"]'
        v-model="appLang"
        disabled
      )
</template>
<script>
export default {
  data() {
    return {
      appLang: 'EN',
    }
  },
  computed: {},
  watch: {},
}
</script>

<style media="screen" lang="scss" scoped>
.title {
  a {
    text-decoration: none;
  }
}
</style>
