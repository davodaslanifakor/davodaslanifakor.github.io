import withNuxt from './.nuxt/eslint.config.mjs'

// Published legacy demos are preserved byte-for-byte, including their vendor bundles.
export default withNuxt({ ignores: ['public/draco/**', 'public/app-todo-vue/**', 'public/todo-app/**', 'public/dist/**', 'public/vue.js', 'public/prism.js'] }, {
  rules: {
    'vue/multi-word-component-names': 'off',
  },
})
