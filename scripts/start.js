#!/usr/bin/env node

'use strict';

require('dotenv').config();

const path = require('path');
const yargs = require('yargs');
const planify = require('planify');
const pify = require('pify');
const internalIp = require('internal-ip');
const yn = require('yn');
const express = require('express');
const send = require('send');
const compression = require('compression');
const { render, renderError } = require('./middlewares/render');
const readBuildManifest = require('./build-manifest/read');
const { publicDir, buildDir, buildUrlPath, serviceWorkerFile } = require('./util/constants');
const gzipStatic = require('express-static-gzip');

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
    describe: 'The port to bind to',
})
.option('compression', {
    alias: 'gz',
    type: 'boolean',
    default: yn(process.env.COMPRESSION, { default: true }),
    describe: 'Enable or disable on the fly compression of responses',
})
.option('reporter', {
    type: 'string',
    describe: 'Any of the planify\'s reporters',
})
.example('$0', 'Serves the last built application')
.example('$0 --port 8081', 'Serves the last built application on port 8081')
.example('$0 --no-compression', 'Serves the last built application without on the fly compression')
.argv;

// ---------------------------------------------------------
// Functions
// ---------------------------------------------------------

function prepare(data) {
    // Force ENV to production
    process.env.NODE_ENV = 'production';

    // Read the manifest & import the server code
    data.buildManifest = readBuildManifest();

    const serverFile = `${buildDir}/${data.buildManifest.server.file}`;

    try {
        data.exports = require(serverFile);
    } catch (err) {
        err.detail = `This error happened when loading the server file at ${path.relative('', serverFile)}`;
        err.hideStack = false;
        throw err;
    }

    process.stdout.write(`Build hash: ${data.buildManifest.hash}\n`);
    process.stdout.write(`Server build hash: ${data.buildManifest.server.hash}\n`);
}

async function runServer(data) {
    const { host, port, compression: compress } = argv;
    const app = express();

    // Configure express app
    app.set('x-powered-by', false); // Remove x-powered-by header

    // Setup compression of responses
    compress && app.use(compression());

    // Serve service-worker from the root
    app.use('/service-worker.js', (req, res) => send(req, serviceWorkerFile).pipe(res));

    // Serve files fom the build dir
    // These files are hashed, therefore it's safe to cache them indefinitely
    // Note that we use `express-static-gzip` to serve pre-compressed files!
    app.use(buildUrlPath, gzipStatic(buildDir, {
        maxAge: 31557600000, // 1 year
        immutable: true, // No conditional requests
        etag: false, // Not necessary
        index: false, // Disable directory listing
        fallthrough: false, // Ensure that requests do not propagate to other middleware
        enableBrotli: true, // Add suport for brotli compressed files
    }));

    // Serve files fom the public dir
    app.use(express.static(publicDir, {
        index: false,
    }));

    // If it's not a public file, render the app!
    app.use(
        // There's no compilation to be done, just set the `res.locals`
        (req, res, next) => {
            res.locals.isomorphic = {
                exports: data.exports,
                buildManifest: data.buildManifest,
            };
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
    process.stdout.write(`Compression:               ${compress ? 'on' : 'off'}\n`);
    process.stdout.write('\nServer is now up and running, press CTRL-C to stop.\n');
}

// ---------------------------------------------------------
// Steps
// ---------------------------------------------------------

planify()
.step('Preparing', prepare)
.step('Running server', runServer)
.run({ reporter: argv.reporter })
.catch((err) => process.exit(err.exitCode || 1));
