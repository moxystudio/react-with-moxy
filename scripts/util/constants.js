'use strict';

const path = require('path');

const projectDir = path.resolve(__dirname, '../../');
const srcDir = path.join(projectDir, 'src');
const publicDir = path.join(projectDir, 'public');
// `buildDir` must be a sulfolder of `publicDir` and must not contain any unsafe URL char
// in its name, such as # or ?
const buildDir = path.join(publicDir, 'build');

module.exports = {
    projectDir,
    srcDir,
    publicDir,
    buildDir,
    buildUrlPath: `/${path.relative(publicDir, buildDir).replace(/\\/g, '/')}`,
    entryServerFile: path.join(srcDir, 'entry-server.js'),
    entryClientFile: path.join(srcDir, 'entry-client.js'),
};
