var babel = require('rollup-plugin-babel');
var babelrc = require('babelrc-rollup').default;

var pkg = require('./package.json');
var external = Object.keys(pkg.dependencies);

module.exports = {
  entry: 'src/index.js',
  globals: {
    moment: 'moment' 
  },
  plugins: [
    babel(babelrc())
  ],
  external: external,
  targets: [
    {
      dest: pkg.main,
      format: 'umd',
      moduleName: 'Dalmatiner',
      sourceMap: true
    }
  ]
};