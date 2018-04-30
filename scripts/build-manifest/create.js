'use strict';

const path = require('path');
const sortChunks = require('webpack-sort-chunks').default;
const escapeRegExp = require('lodash/escapeRegExp');
const merge = require('deepmerge');

function parseWebpackStats(statsJson) {
    const { hash, publicPath, chunks } = statsJson;

    // Generate assets, grouping by extension/secondary
    // Note that we must sort chunks so that dependency order is correct
    const assets = sortChunks(chunks).reduce((assets, chunk) => {
        chunk.files
        .filter((file) => !file.endsWith('.map')) // Exclude source map files
        .forEach((file) => {
            const ext = path.extname(file).substr(1);
            const key = chunk.initial ? ext : 'secondary';

            assets[key] = assets[key] || [];
            assets[key].push({
                file,
                url: publicPath + file,
            });
        });

        return assets;
    }, { js: [], css: [], secondary: [] });

    return {
        hash,
        publicPath,
        assets,
    };
}

function removeServerBundle(manifest, statsJson) {
    const { entrypoints } = statsJson;

    // Grab the server chunk name & asset
    const serverEntrypoint = entrypoints[Object.keys(entrypoints)[0]];
    const serverAsset = serverEntrypoint && serverEntrypoint.assets.find((asset) => /\.js$/.test(asset));

    // Remove it from the assets
    const bundleRegExp = new RegExp(`${escapeRegExp(serverAsset)}(\\.map)?$`);

    manifest.assets.js = manifest.assets.js.filter(({ file }) => !bundleRegExp.test(file));

    return serverAsset;
}

function createBuildManifest({ clientStats, serverStats }) {
    // Convert stats to objects
    const clientStatsJson = clientStats.toJson();
    const serverStatsJson = serverStats.toJson();

    // Do a common parse of the stats
    const clientManifest = parseWebpackStats(clientStatsJson);
    const serverManifest = parseWebpackStats(serverStatsJson);

    // Remove server bundle from assets
    const serverFile = removeServerBundle(serverManifest, serverStatsJson);

    // Merge manifests, giving more importance to the client
    const manifest = merge(serverManifest, clientManifest, {
        arrayMerge: (destinationArray, sourceArray) => [...sourceArray, ...destinationArray],
        clone: true,
    });

    // Add server to manifest
    manifest.server = {
        hash: serverManifest.hash,
        file: serverFile,
    };

    return manifest;
}

module.exports = createBuildManifest;
