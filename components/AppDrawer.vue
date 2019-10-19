<template lang="pug">
  v-navigation-drawer(app permanent mini-variant dark expand-on-hover)
    v-list-item(href="https://github.com/likeablob/shihen" target="_blank")
      v-list-item-icon()
        v-icon mdi-information-outline
      v-list-item-content
        v-list-item-title.title
          | SHIHEN
    v-divider
    v-list(dense nav)
      v-list-item(v-for="item in items" :key="item.title" nuxt :to="item.to")
        v-list-item-icon
          v-icon {{ item.icon }}
        v-list-item-content
          v-list-item-title {{ item.title }}
    template(v-slot:append)
      v-footer.footer
        span Made by
          a.px-2(href="https://github.com/likeablob/shihen" target="_blank") likeablob
</template>
<script>
export default {
  data() {
    return {
      appLang: 'EN',
      items: [
        {
          icon: 'mdi-format-text',
          title: 'Text',
          to: '/',
        },
        {
          icon: 'mdi-file-video',
          title: 'Video',
          to: '/video',
        },
      ],
    }
  },
  computed: {},
  watch: {},
}
</script>

<style media="screen" lang="scss">
.v-navigation-drawer--mini-variant {
  .footer span {
    display: none;
  }
}

.footer span {
  font-size: 14px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  height: 0px;
  a {
    text-decoration: none;
  }
}

.footer:hover {
  span {
    display: flex;
    height: 20px;
    transition: 0.3s;
    transition-timing-function: ease-in-out;
  }
}
</style>
