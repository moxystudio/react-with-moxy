const assert = require('assert');
const validEnvironments = ['production', 'development', 'test'];

function getEnvVariables() {
    assert(validEnvironments.includes(process.env.NODE_ENV), `Expecting NODE_ENV to be one of: ${validEnvironments.join(', ')}`);
    assert(process.env.SITE_URL != null, 'Expecting SITE_URL environment variable to be defined');
    assert(!process.env.SITE_URL.endsWith('/'), 'SITE_URL environment variable must not end with /');
    assert(process.env.PUBLIC_URL != null, 'Expecting PUBLIC_URL environment variable to be defined');
    assert(!process.env.PUBLIC_URL.endsWith('/'), 'PUBLIC_URL environment variable must not end with /');

    // Construct the env variables, starting with `NODE_ENV`, `SITE_URL` and `PUBLIC_URL`.
    // - `NODE_ENV` - Useful for determining whether we are running in production mode.
    //   Most importantly, it switches React into the correct mode.
    // - `PUBLIC_URL` - Useful when generating full URLs to files present in the `public` folder.
    // - `SITE_URL` - Useful when generating full URLs to use in "copy to clipboard"
    //   or in social share buttons.
    const env = {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PUBLIC_URL: process.env.PUBLIC_URL,
        SITE_URL: process.env.SITE_URL,
    };

    // Add the `REACT_APP_*` into the output environment variables.
    Object.keys(process.env)
    .filter((key) => /REACT_APP_/.test(key))
    .forEach((key) => {
        env[key] = process.env[key];
    });

    return env;
}

// Stringify env variables so we can feed into Webpack DefinePlugin
// Optionally you can also include `process.env` so that destructuring process.env works
function inlineEnvVariables(envVars, options) {
    options = { includeProcessEnv: false, ...options };

    return Object.keys(envVars).reduce((defs, key) => {
        defs[`process.env.${key}`] = JSON.stringify(envVars[key]);

        return defs;
    }, options.includeProcessEnv ? { 'process.env': JSON.stringify(envVars) } : {});
}

module.exports = {
    getEnvVariables,
    inlineEnvVariables,
};
