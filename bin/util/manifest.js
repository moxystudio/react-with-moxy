'use strict';

const reduce = require('lodash/reduce');
const _merge = require('lodash/merge');

const routeRegExp = /src\/pages\/([a-z][a-z-_/]+)\/index\.js$/;

function fromWebpackStats(stats) {
    stats = stats.toJson();

    // Gather assets
    const assets = reduce(stats.assetsByChunkName, (aggregatedAssets, assets) => {
        assets = Array.isArray(assets) ? assets : [assets];
        assets.forEach((asset) => {
            const key = asset.replace(/\.[a-z0-9]{15,32}(\.[a-z0-9]+)$/, '$1');  // Remove hash

            aggregatedAssets[key] = stats.publicPath + asset;
        });

        return aggregatedAssets;
    }, {});

    // Gather async routes
    const asyncRoutes = stats.chunks.reduce((routes, chunk) => {
        if (!chunk.entry && chunk.origins) {
            chunk.origins.some((origin) => {
                const match = origin.module.match(routeRegExp);
                const name = match && match[1];

                if (name) {
                    routes[name] = stats.publicPath + chunk.files[0];
                }

                return match;
            });
        }

        return routes;
    }, {});

    // Gather sync routes
    const syncRoutes = stats.modules.reduce((routes, module) => {
        module.reasons.forEach((reason) => {
            const match = reason.module.match(routeRegExp);
            const name = match && match[1];

            if (name && !asyncRoutes[name]) {
                routes[name] = true;
            }

            return match;
        });

        return routes;
    }, {});

    return {
        assets,
        routes: {
            sync: syncRoutes,
            async: asyncRoutes,
        },
    };
}

function merge(serverBuildData, clientBuildData) {
    // No fancy merging for now..
    return _merge(serverBuildData, clientBuildData);
}

module.exports = {
    fromWebpackStats,
    merge,
};
