'use strict';

const path = require('path');

const projectDir = path.resolve(__dirname, '../../');
const publicDir = path.join(projectDir, 'public');
const srcDir = path.join(projectDir, 'src');

module.exports = {
    projectDir,
    publicDir,
    srcDir,

    entryServerFile: path.join(srcDir, 'entry-server.js'),
    entryClientFile: path.join(srcDir, 'entry-client.js'),
};
