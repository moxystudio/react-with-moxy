const babel = require('babel-core');
const { getBabelOptions } = require('../webpack');

const babelOptions = getBabelOptions('server');

module.exports = {
    process(src, filename) {
        return babel.util.canCompile(filename) ?
            babel.transform(src, { filename, ...babelOptions }).code :
            src;
    },
};
