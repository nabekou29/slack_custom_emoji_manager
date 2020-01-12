module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    chrome: 'readonly'
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    'import/order': 'off',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': 'off',
    'no-unused-vars': 'off',
    'no-unused-expressions': 'off',
    'no-await-in-loop': 'off',
    'no-restricted-syntax': 'off',
    quotes: ['warn', 'single']
  }
};
