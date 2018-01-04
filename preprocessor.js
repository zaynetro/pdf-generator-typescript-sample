// From: https://github.com/facebook/jest/blob/master/examples/typescript/preprocessor.js
// Used for Jest tests to compile typescript into JS.

// Copyright 2004-present Facebook. All Rights Reserved.

const tsc = require('typescript');
const tsConfig = require('./tsconfig.json');

module.exports = {
  process(src, path) {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      return tsc.transpile(src, tsConfig.compilerOptions, path, []);
    }
    return src;
  },
};
