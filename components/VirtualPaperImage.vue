<template lang="pug">
.container()
  img(:width="width" :height="height" :src="src")
</template>

<script>
// import _ from 'lodash'

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
    }
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
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  overflow: hidden;
}
</style>
