import _ from 'lodash'

const defaultText = `# Editor area
Write text here as you like.
One line corresponds with one page.
Break text by inserting "||" symbols.`

export const state = () => ({
  pages: defaultText.split('\n'),
})

export const getters = {}

export const mutations = {
  setPages(state, data) {
    state.pages = _.compact(data)
  },
  shufflePages(state) {
    state.pages = _.shuffle(state.pages)
  },
}

export const actions = {}
