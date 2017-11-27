const assert = require('assert');

const validEnvironments = ['production', 'development', 'test'];

function definePluginEnv() {
    assert(validEnvironments.includes(process.env.NODE_ENV), `Expecting NODE_ENV to be one of: ${validEnvironments.join(', ')}`);
    assert(process.env.PUBLIC_URL != null, 'Expecting PUBLIC_URL environment variable to be defined');
    assert(process.env.PUBLIC_ASSETS_URL != null, 'Expecting PUBLIC_URL environment variable to be defined');

    // Grab NODE_ENV and RWM_* environment variables and prepare them to be
    // injected into the application via DefinePlugin in Webpack configuration
    const env = Object.keys(process.env)
    .filter((key) => /RWM_/.test(key))
    .reduce((env, key) => {
        env[key] = process.env[key];

        return env;
    }, {
        // Useful for determining whether we’re running in production mode
        // Most importantly, it switches React into the correct mode
        NODE_ENV: process.env.NODE_ENV,

        // Useful to build full urls to be used in stuff like share URLs
        PUBLIC_URL: process.env.PUBLIC_URL.replace(/\/+$/, ''),
        // Useful for resolving the correct path to static assets in `public` folder
        PUBLIC_ASSETS_URL: process.env.PUBLIC_ASSETS_URL.replace(/\/+$/),
    });

    // Stringify all values so we can feed into Webpack DefinePlugin
    // Note that we not only generate `process.env.xxx` but also `process.env` so that destructuring process.env works
    const defs = Object.keys(env).reduce((defs, key) => {
        defs[`process.env.${key}`] = JSON.stringify(env[key]);

        return defs;
    }, {
        'process.env': JSON.stringify(env),
    });

    return defs;
}

module.exports = definePluginEnv;
