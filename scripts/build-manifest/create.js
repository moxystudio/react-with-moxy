'use strict';

const path = require('path');
const escapeRegExp = require('lodash/escapeRegExp');
const merge = require('deepmerge');
const toposort = require('toposort');

// Switch back `webpack-sort-chunks` if https://github.com/diegohaz/webpack-sort-chunks/issues/3 gets resolved
// It was throwing an error related to cyclic dependencies
const sortChunks = (chunks, compilation) => {
    const chunkGroups = compilation.chunkGroups;

    // We build a map (chunk-id -> chunk) for faster access during graph building.
    const nodeMap = {};

    chunks.forEach((chunk) => {
        nodeMap[chunk.id] = chunk;
    });

    // Next, we add an edge for each parent relationship into the graph
    const edges = chunkGroups.reduce((result, chunkGroup) => result.concat(
        Array.from(chunkGroup.parentsIterable, (parentGroup) => [parentGroup, chunkGroup])
    ), []);

    const sortedGroups = toposort.array(chunkGroups, edges);
    // Flatten chunkGroup into chunks
    const sortedChunks = sortedGroups
    .reduce((result, chunkGroup) => result.concat(chunkGroup.chunks), [])
    .map((chunk) => // Use the chunk from the list passed in, since it may be a filtered list
        nodeMap[chunk.id])
    .filter((chunk, index, self) => {
        // Make sure exists (ie excluded chunks not in nodeMap)
        const exists = !!chunk;
        // Make sure we have a unique list
        const unique = self.indexOf(chunk) === index;

        return exists && unique;
    });

    return sortedChunks;
};

function parseWebpackStats(statsJson, compilation) {
    const { hash, publicPath, chunks } = statsJson;
    const emittedAssets = new Set(statsJson.assets.map((asset) => asset.name));

    // Generate assets, grouping by extension/secondary
    // Note that we must sort chunks so that dependency order is correct
    const assets = sortChunks(chunks, compilation).reduce((assets, chunk) => {
        chunk.files
        .filter((file) => !file.endsWith('.map')) // Exclude source map files
        .filter((file) => emittedAssets.has(file)) // Exclude ignored files (non-emitted)
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
    const { assets } = statsJson;

    // Grab the server asset
    const serverAssetName = assets
    .map((asset) => asset.name)
    .find((asset) => /\bserver\b.*\.js$/.test(asset));

    // Remove it from the assets, including it's source map files
    const serverAssetNameRegExp = new RegExp(`${escapeRegExp(serverAssetName)}(\\.map)?$`);

    manifest.assets.js = manifest.assets.js.filter(({ file }) => !serverAssetNameRegExp.test(file));

    return serverAssetName;
}

function createBuildManifest({ clientStats, serverStats }) {
    // Convert stats to objects
    const clientStatsJson = clientStats.toJson();
    const serverStatsJson = serverStats.toJson();

    // Do a common parse of the stats
    const clientManifest = parseWebpackStats(clientStatsJson, clientStats.compilation);
    const serverManifest = parseWebpackStats(serverStatsJson, serverStats.compilation);

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
