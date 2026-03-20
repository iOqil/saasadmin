// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/no-multiple-template-root': 'off',
    'vue/max-attributes-per-line': ['error', { singleline: 3 }],
    'vue/singleline-html-element-content-newline': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@stylistic/max-statements-per-line': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-dynamic-delete': 'off',
    '@stylistic/comma-dangle': 'off',
    '@stylistic/quotes': 'off',
    'import/first': 'off',
    'no-empty': 'off'
  }
})
