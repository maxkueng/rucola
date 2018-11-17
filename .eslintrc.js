module.exports = {
  parser: 'babel-eslint',
  extends: [
    'airbnb-base',
  ],
  rules: {
    'no-multiple-empty-lines': [
      'error',
      {
        max: 2,
        maxEOF: 1,
      },
    ],
    'semi-style': 'off',
    'import/prefer-default-export': 'off',
  },
  settings: {
    'import/resolver': {
      'babel-module': {},
    },
  },
  env: {
    node: true,
    browser: false,
  },
};
