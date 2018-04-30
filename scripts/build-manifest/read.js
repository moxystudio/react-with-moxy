'use strict';

const fs = require('fs');
const path = require('path');
const { buildDir } = require('../util/constants');

function readBuildManifest() {
    const buildManifestFile = path.join(buildDir, 'build-manifest.json');

    try {
        return JSON.parse(fs.readFileSync(buildManifestFile));
    } catch (err) {
        err.detail = `Could not read manifest file on ${path.relative('', buildManifestFile)}`;
        err.detail += err.code === 'ENOENT' ? '\nDid you forgot to build the project?' : '';

        throw err;
    }
}

module.exports = readBuildManifest;
