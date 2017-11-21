const babel = require('babel-core');
const { getBabelOptions } = require('../webpack');

const babelOptions = getBabelOptions('client');

module.exports = {
    process(src, filename) {
        return babel.util.canCompile(filename) ?
            babel.transform(src, Object.assign({}, { filename }, babelOptions)).code :
            src;
    },
};
