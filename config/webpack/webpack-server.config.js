/* eslint camelcase:0, global-require:0 */

'use strict';

const assert = require('assert');
const path = require('path');
const assign = require('lodash/assign');
const projectDir = path.resolve(`${__dirname}/../..`);
const packageJson = require(`${projectDir}/package.json`);

// Webpack plugins
const SvgStorePlugin = require('external-svg-sprite-loader/lib/SvgStorePlugin');
const NamedModulesPlugin = require('webpack/lib/NamedModulesPlugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const NoEmitOnErrorsPlugin = require('webpack/lib/NoEmitOnErrorsPlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');

module.exports = (options) => {
    options = assign({ env: 'dev' }, options);
    options.build = options.build != null ? !!options.build : options.env !== 'dev';
    options.minify = options.minify != null ? !!options.minify : options.env !== 'dev';

    // Ensure that some options play well together
    options.env !== 'dev' && assert(options.build === true, `Option "build" must be enabled for env ${options.env}`);
    !options.build && assert(options.minify === false, `Option "minify" must be disabled when "build" is disabled for env ${options.env}`);

    const config = require(`${projectDir}/config/config-${options.env}`);

    return {
        context: projectDir,
        entry: {
            'server-renderer': [
                // 'babel-polyfill',  // Do not uncomment, included only once in server and server-dev
                './src/server-renderer.js',
            ],
        },
        output: {
            path: `${projectDir}/web/build/`,
            publicPath: `${config.publicPath}/`,
            filename: '[name].js',
            libraryTarget: 'this',
        },
        resolve: {
            alias: {
                config: `${projectDir}/config/config-${options.env}.js`,
                shared: `${projectDir}/src/shared`,
            },
        },
        target: 'node',  // Need this for certain libraries such as 'axios' to work
        // Need this to properly set __dirname and __filename
        node: {
            __dirname: false,
            __filename: false,
        },
        module: {
            rules: [
                // Babel loader enables us to use new ECMA features + react's JSX
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                cacheDirectory: true,
                                presets: [
                                    'es2015',
                                    'stage-3',
                                    'react',
                                ].filter((val) => val),
                                plugins: [
                                    // Necessary for import() to work
                                    'dynamic-import-node',
                                    // Transforms that optimize build
                                    options.build ? 'transform-react-remove-prop-types' : null,
                                    options.build ? 'transform-react-constant-elements' : null,
                                    options.build ? 'transform-react-inline-elements' : null,
                                ].filter((val) => val),
                            },
                        },
                        // Enable preprocess-loader so that we can use @ifdef DEV when declaring routes
                        // See: https://github.com/gaearon/react-hot-loader/issues/288#issuecomment-281372266
                        !options.build ? 'preprocess-loader?+DEV' : 'preprocess-loader',
                    ],
                },
                // CSS files loader which enables the use of postcss & cssnext
                {
                    test: /\.css$/,
                    loader: ExtractTextPlugin.extract({
                        use: [
                            {
                                // When building, we do not want to include the CSS contents.. the client will be responsible for that
                                loader: options.build ? 'css-loader/locals' : 'css-loader',
                                options: {
                                    modules: true,
                                    sourceMap: true,
                                    importLoaders: 1,
                                    camelCase: 'dashes',
                                    localIdentName: '[name]__[local]___[hash:base64:5]!',
                                },
                            },
                            {
                                loader: 'postcss-loader',
                                options: {
                                    plugins: [
                                        // Let postcss parse @import statements
                                        require('postcss-import')({
                                            // Any non-relative imports are resolved to this path
                                            path: './src/shared/styles/imports',
                                        }),
                                        // Add support for CSS mixins
                                        require('postcss-mixins'),
                                        // Add support for CSS variables using postcss-css-variables
                                        // instead of cssnext one, which is more powerful
                                        require('postcss-css-variables')(),
                                        // Use CSS next, disabling some features
                                        require('postcss-cssnext')({
                                            features: {
                                                overflowWrap: true,
                                                rem: false,               // Not necessary for our browser support
                                                colorRgba: false,         // Not necessary for our browser support
                                                customProperties: false,  // We are using postcss-css-variables instead
                                                autoprefixer: {
                                                    browsers: ['last 2 versions', 'IE >= 11', 'android >= 4.4.4'],
                                                    remove: false, // No problem disabling, we use prefixes when really necessary
                                                },
                                            },
                                        }),
                                    ],
                                },
                            },
                        ],
                    }),
                },
                // Load SVG files and create an external sprite
                // While this has a lot of advantages, such as not blocking the initial load, it can't contain
                // inline SVGs, see: https://github.com/moxystudio/react-with-moxy/issues/6
                {
                    test: /\.svg$/,
                    exclude: [/\.inline\.svg$/, './src/shared/media/fonts'],
                    use: [
                        {
                            loader: 'external-svg-sprite-loader',
                            options: {
                                name: 'images/svg-sprite.[hash:15].svg',
                                prefix: 'svg',
                            },
                        },
                        'svg-css-modules-loader?transformId=true',
                    ],
                },
                // Loader for inline SVGs to support SVGs that do not integrate well with external-svg-sprite-loader,
                // see: https://github.com/moxystudio/react-with-moxy/issues/6
                {
                    test: /\.inline\.svg$/,
                    use: [
                        'raw-loader',
                        {
                            loader: 'svgo-loader',
                            options: {
                                plugins: [
                                    { removeTitle: true },
                                    { removeDimensions: true },
                                ],
                            },
                        },
                        'svg-css-modules-loader?transformId=true',
                    ],
                },
                // Raster images (png, jpg, etc)
                {
                    test: /\.(png|jpg|jpeg|gif)$/,
                    loader: 'file-loader',
                    options: {
                        emitFile: false,
                        name: 'images/[name].[hash:15].[ext]',
                    },
                },
                // Videos
                {
                    test: /\.(mp4|webm|ogg|ogv)$/,
                    loader: 'file-loader',
                    options: {
                        emitFile: false,
                        name: 'videos/[name].[hash:15].[ext]',
                    },
                },
                // Web fonts
                {
                    test: /\.(eot|ttf|woff|woff2)$/,
                    loader: 'file-loader',
                    options: {
                        emitFile: false,
                        name: 'fonts/[name].[hash:15].[ext]',
                    },
                },
                // Dependencies that do not work on server-side or are unnecessary for server-side rendering
                {
                    test: [
                        // require.resolve('some-module'),
                    ],
                    loader: 'skip-loader',
                },
            ],
        },
        plugins: [
            // Ensures that files with NO errors are produced
            new NoEmitOnErrorsPlugin(),
            // Configure debug & minimize
            new LoaderOptionsPlugin({
                minimize: options.minify,
                debug: options.env === 'dev',
            }),
            // Reduce react file size as well as other libraries
            new DefinePlugin({
                'process.env': {
                    NODE_ENV: `"${!options.build ? 'development' : 'production'}"`,
                },
                __CLIENT__: false,
                __SERVER__: true,
                __DEV__: !options.build,
            }),
            // Enabling gives us better debugging output
            new NamedModulesPlugin(),
            // Alleviate cases where developers working on OSX, which does not follow strict path case sensitivity
            new CaseSensitivePathsPlugin(),
            // At the moment we only generic a single app CSS file which is kind of bad, see: https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/332
            new ExtractTextPlugin({
                filename: 'app.css',
                allChunks: true,
                disable: options.build,
            }),
            // External svg sprite plugin
            new SvgStorePlugin({ emit: false }),
            // Display build status system notification to the user
            !options.build && new WebpackNotifierPlugin({
                title: packageJson.name,
                contentImage: `${projectDir}/web/favicon.ico`,
            }),
        ].filter((val) => val),
        devtool: false,  // Not necessary because they are not supported in NodeJS (maybe they are?)
    };
};
