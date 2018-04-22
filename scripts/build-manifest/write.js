'use strict';

const fs = require('fs');
const path = require('path');
const createBuildManifest = require('./create');
const { publicDir } = require('../util/constants');

function writeBuildManifest(stats) {
    const buildManifest = createBuildManifest(stats);
    const buildManifestFile = path.join(publicDir, 'build/build-manifest.json');

    try {
        fs.writeFileSync(buildManifestFile, JSON.stringify(buildManifest, null, 4));
    } catch (err) {
        err.detail = `Could not write build manifest file on ${path.relative('', buildManifest)}`;
        err.detail += err.code === 'ENOENT' ? `\nDid you forgot to create ${path.relative('', `${publicDir}/build`)}?` : '';

        throw err;
    }

    return buildManifest;
}

module.exports = writeBuildManifest;
