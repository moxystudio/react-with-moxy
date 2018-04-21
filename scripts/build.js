#!/usr/bin/env node

require('dotenv').config();

const path = require('path');
const yargs = require('yargs');
const planify = require('planify');
const rimraf = require('rimraf');
const webpackIsomorphicCompiler = require('webpack-isomorphic-compiler');
const webpackIsomorphicCompilerReporter = require('webpack-isomorphic-compiler-reporter');
const { getConfig: getWebpackConfig } = require('./config/webpack');
const writeBuildManifest = require('./build-manifest/write');
const { publicDir } = require('./util/constants');

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
.option('minify', {
    type: 'boolean',
    default: true,
    describe: 'Whether to minify assets or not',
})
.option('reporter', {
    type: 'string',
    describe: 'Any of the planify\'s reporters',
})
.example('$0', 'Builds the application')
.example('$0 --no-minify', 'Builds the application without minifying code')

.argv;

// ---------------------------------------------------------
// Functions
// ---------------------------------------------------------

function prepare() {
    // Force ENV to production
    process.env.NODE_ENV = 'production';

    // Clean previous build
    rimraf.sync(`${publicDir}/build`);

    process.stdout.write('Previous build removed successfully.\n');
}

async function build(data, { minify }) {
    // Create configs
    const clientConfig = getWebpackConfig('client', { minify });
    const serverConfig = getWebpackConfig('server', { minify });

    // Compile both the client & server
    const isomorphicCompiler = webpackIsomorphicCompiler(clientConfig, serverConfig);

    webpackIsomorphicCompilerReporter(isomorphicCompiler);

    // Compile and assign the result to be used below
    data.compilation = await isomorphicCompiler.run();
}

function createBuildManifest({ compilation }) {
    writeBuildManifest(compilation);

    process.stdout.write(`Manifest successfully created in the ${path.relative('', `${publicDir}/build`)} folder.\n`);
}

// ---------------------------------------------------------
// Steps
// ---------------------------------------------------------

planify()
.step('Preparing', prepare)
.step('Building project with webpack', { slow: 15000 }, (data) => build(data, argv))
.step('Creating build manifest', createBuildManifest)
.run({ exit: true, reporter: argv.reporter });
