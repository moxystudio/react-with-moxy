#!/usr/bin/env node

'use strict';

require('dotenv').config();

const yargs = require('yargs');
const planify = require('planify');
const rimraf = require('rimraf');
const getPort = require('get-port');
const yn = require('yn');
const internalIp = require('internal-ip');
const express = require('express');
const openBrowser = require('react-dev-utils/openBrowser');
const pify = require('pify');
const webpackIsomorphicCompiler = require('webpack-isomorphic-compiler');
const webpackIsomorphicDevMiddleware = require('webpack-isomorphic-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const { render, renderError } = require('./middlewares/render');
const { getConfig: getWebpackConfig } = require('./config/webpack');
const createBuildManifest = require('./build-manifest/create');
const { publicDir, buildDir, buildUrlPath } = require('./util/constants');

// ---------------------------------------------------------
// CLI definition
// ---------------------------------------------------------

const argv = yargs
.strict()
.wrap(Math.min(120, yargs.terminalWidth()))
.help()
.alias('help', 'h')
.version()
.alias('version', 'v')
.usage('Usage: ./$0 [options]')
.option('host', {
    alias: 'H',
    type: 'string',
    default: process.env.HOST || process.env.HOSTNAME || '0.0.0.0',
    describe: 'The host to bind to',
})
.option('port', {
    alias: 'p',
    type: 'number',
    default: Number(process.env.PORT) || 3000,
    describe: 'The preferred port to bind to',
})
.option('poll', {
    type: 'boolean',
    default: yn(process.env.WEBPACK_DEV_POOL, { default: false }),
    describe: 'Use polling when watching for file changes, disable it if you are having issues with polling (defaults to automatic)',
})
.option('memory-fs', {
    type: 'boolean',
    default: yn(process.env.WEBPACK_MEMORY_FS, { default: true }),
    describe: 'Use an in-memory filesystem instead of writing assets to disk (recommended)',
})
.option('reporter', {
    type: 'string',
    describe: 'Any of the planify\'s reporters',
})
.example('$0', 'Serves the application for local development')
.example('$0 --port 8081', 'Serves the application for local development on port 8081')
.example('$0 --no-memory-fs', 'Write files in disk instead of in memory ')
.argv;

// ---------------------------------------------------------
// Functions
// ---------------------------------------------------------

function createIsomorphicCompiler() {
    // Build webpack configs
    const clientConfig = getWebpackConfig('client');
    const serverConfig = getWebpackConfig('server');

    // Create the isomorphic compiler
    return webpackIsomorphicCompiler(clientConfig, serverConfig);
}

// ---------------------------------------------------------
// Steps
// ---------------------------------------------------------

function prepare(data) {
    // Force ENV to development
    process.env.NODE_ENV = 'development';

    // Remove previous build
    rimraf.sync(buildDir);
    process.stdout.write('Previous build removed successfully.\n');

    // Create isomorphic compiler
    data.isomorphicCompiler = createIsomorphicCompiler(argv);
}

async function findFreePort() {
    const port = await getPort({
        host: argv.host,
        port: [
            argv.port,
            ...[3000, 3010, 3020, 3030, 3040, 3050, 3060, 3070, 3080, 3090, 8080],
        ],
    });

    if (port !== argv.port) {
        process.stdout.write(`Port ${argv.port} is already in use, using ${port} instead..\n`);
        argv.port = port;
    } else {
        process.stdout.write(`Port ${argv.port} is free.\n`);
    }
}

async function runServer(data) {
    const { host, port, poll, memoryFs } = argv;
    const { isomorphicCompiler } = data;
    const app = express();

    // Setup compilaton so that changes are compiled on the fly!
    app.use(webpackIsomorphicDevMiddleware(isomorphicCompiler, {
        memoryFs,
        watchDelay: 50,
        watchOptions: { poll },
        // OS notifications! (skip if CI)
        notify: { icon: !process.env.CI ? `${publicDir}/favicon.ico` : undefined },
    }));
    app.use(webpackHotMiddleware(isomorphicCompiler.client.webpackCompiler, {
        log: false,
    }));

    // Serve files fom the build dir
    // This is here only if `webpackIsomorphicDevMiddleware` doesn't know the requested file
    app.use(buildUrlPath, express.static(buildDir, {
        index: false,
        fallthrough: false, // Ensure that requests do not propagate to other middleware
    }));

    // Serve files fom the public dir
    app.use(express.static(publicDir, {
        index: false,
    }));

    // If it's not a public file, render the app!
    app.use(
        (req, res, next) => {
            const { isomorphic } = res.locals;

            isomorphic.buildManifest = isomorphic.buildManifest || createBuildManifest(isomorphic.compilation);
            next();
        },
        // Setup the render middlewares that will call render() & renderError()
        render(),
        renderError()
    );

    // Start server
    await pify(app.listen).call(app, port, host);

    const url = `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`;
    const lanUrl = `http://${await internalIp.v4()}:${port}`;

    process.stdout.write(`Server address:            ${url}\n`);
    process.stdout.write(`LAN server address:        ${lanUrl}\n`);
    process.stdout.write('Hot module replacement:    on\n');
    process.stdout.write('\nServer is now up and running, press CTRL-C to stop.\n');

    // Open app in the browser (skip if doing CI)
    !process.env.CI && openBrowser(url);
}

// ---------------------------------------------------------
// Steps
// ---------------------------------------------------------

planify({ reporter: argv.reporter })
.step('Preparing', prepare)
.step('Finding free port', findFreePort)
.step('Running server', runServer)
.run()
.catch((err) => process.exit(err.exitCode || 1))
// Print a new line after planify ends to separate from the subsequent compilations
.then(() => process.stdout.write('\n'));
