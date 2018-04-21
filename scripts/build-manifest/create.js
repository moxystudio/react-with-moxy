const path = require('path');
const sortChunks = require('webpack-sort-chunks').default;
const escapeRegExp = require('lodash/escapeRegExp');
const castArray = require('lodash/castArray');
const merge = require('deepmerge');

function parseWebpackStats(stats) {
    const { hash, publicPath } = stats;

    // Generate assets, grouping by extension/secondary
    // Note that we must sort chunks so that dependency order is correct
    const assets = sortChunks(stats.chunks).reduce((assets, chunk) => {
        chunk.files
        .filter((file) => !file.endsWith('.map')) // Exclude source map files
        .forEach((file) => {
            const ext = path.extname(file).substr(1);
            const key = chunk.initial ? ext : 'secondary';

            assets[key] = assets[key] || [];
            assets[key].push({
                file,
                url: stats.publicPath + file,
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

function removeServerBundle(manifest, stats) {
    // Grab the server chunk name & asset
    const chunkName = Object.keys(stats.entrypoints)[0];
    const asset = castArray(stats.assetsByChunkName[chunkName])[0];

    // Remove it from the assets
    const bundleRegExp = new RegExp(`${escapeRegExp(asset)}(\\.map)?$`);

    manifest.assets.js = manifest.assets.js.filter(({ file }) => !bundleRegExp.test(file));

    return asset;
}

function createBuildManifest({ clientStats, serverStats }) {
    // Convert stats to objects
    clientStats = clientStats.toJson();
    serverStats = serverStats.toJson();

    // Do a common parse of the stats
    const clientManifest = parseWebpackStats(clientStats);
    const serverManifest = parseWebpackStats(serverStats);

    // Remove server bundle from assets
    const serverFile = removeServerBundle(serverManifest, serverStats);

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
