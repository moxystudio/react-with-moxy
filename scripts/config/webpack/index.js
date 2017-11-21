const configs = {
    client: require('./config-client'),
    server: require('./config-server'),
};

function getConfig(type, options) {
    const getConfig = configs[type];

    if (!getConfig) {
        throw new Error(`Unknown webpack config type: ${type}`);
    }

    return getConfig(options);
}

function getBabelOptions(type, options) {
    const webpackConfig = getConfig(type, options);

    // Find the first babel use rule
    // Note that `use.loader` might be a string in some cases, that's why we verify if `use.loader` exists
    const babelRule = webpackConfig.module.rules.reduce((babelRule, rule) =>
        babelRule || rule.use.find((use) => use.loader && use.loader.includes('babel-loader')), null);

    if (!babelRule) {
        throw new Error('Could not find the babel-loader rule');
    }

    // Remove options from the `babel-loader` that `babel` does not understand
    // This is necessary, otherwise babel will error out saying it doesn't know those options
    const { cacheDirectory, cacheIdentifier, forceEnv, ...babelOptions } = babelRule.options || {};

    return babelOptions;
}

module.exports = {
    getConfig,
    getBabelOptions,
};
