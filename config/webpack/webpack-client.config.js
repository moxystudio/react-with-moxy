/* eslint camelcase:0, global-require:0 */

'use strict';

const assert = require('assert');
const path = require('path');
const assign = require('lodash/assign');
const projectDir = path.resolve(`${__dirname}/../..`);

// Webpack plugins
const SvgStorePlugin = require('external-svg-sprite-loader/lib/SvgStorePlugin');
const NamedModulesPlugin = require('webpack/lib/NamedModulesPlugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');
const NoEmitOnErrorsPlugin = require('webpack/lib/NoEmitOnErrorsPlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');

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
            main: [
                'babel-polyfill',  // Necessary for babel to run (replaces babel-polyfill)
                'dom4',  // Adds dom4 polyfills, such as Element.remove(), etc
                !options.build && 'eventsource-polyfill',  // Necessary to make hmr work on IE
                !options.build && 'react-hot-loader/patch',  // For hot module reload
                !options.build && 'webpack-hot-middleware/client?reload=true',  // For hot module reload
                './src/client-renderer.js',
            ].filter((val) => val),
            deferrable: [
                'svgxuse',  // Necessary because external svgs need a polyfill in IE
            ],
        },
        output: {
            path: `${projectDir}/web/build/`,
            publicPath: `${config.publicPath}/`,
            filename: !options.build ? '[name].js' : '[name].[chunkhash].js',
            chunkFilename: !options.build ? 'chunk.[name].js' : 'chunk.[name].[chunkhash].js',
        },
        resolve: {
            alias: {
                config: `${projectDir}/config/config-${options.env}.js`,
                shared: `${projectDir}/src/shared`,
            },
        },
        node: {
            // Set any node modules here that should be ignored by client side code
            // fs: 'empty',
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
                                    'syntax-dynamic-import',
                                    // <3 hot module reload
                                    !options.build ? 'react-hot-loader/babel' : null,
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
                        fallback: {
                            loader: 'style-loader',
                            options: {
                                convertToAbsoluteUrls: !options.build,
                            },
                        },
                        use: [
                            {
                                loader: 'css-loader',
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
                        name: 'images/[name].[hash:15].[ext]',
                    },
                },
                // Videos
                {
                    test: /\.(mp4|webm|ogg|ogv)$/,
                    loader: 'file-loader',
                    options: {
                        name: 'videos/[name].[hash:15].[ext]',
                    },
                },
                // Web fonts
                {
                    test: /\.(eot|ttf|woff|woff2)$/,
                    loader: 'file-loader',
                    options: {
                        name: 'fonts/[name].[hash:15].[ext]',
                    },
                },
            ],
        },
        plugins: [
            // Ensures that files with NO errors are produced
            new NoEmitOnErrorsPlugin(),
            // Configure debug & minimize
            new LoaderOptionsPlugin({
                minimize: options.minify,
                debug: !options.build,
            }),
            // Reduce react file size as well as other libraries
            new DefinePlugin({
                'process.env': {
                    NODE_ENV: `"${!options.build ? 'development' : 'production'}"`,
                },
                __CLIENT__: true,
                __SERVER__: false,
                __DEV__: !options.build,
            }),
            // Enabling gives us better debugging output
            new NamedModulesPlugin(),
            // Ensures that hot reloading works
            !options.build && new HotModuleReplacementPlugin(),
            // Alleviate cases where developers working on OSX, which does not follow strict path case sensitivity
            new CaseSensitivePathsPlugin(),
            // At the moment we only generic a single app CSS file which is kind of bad, see: https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/332
            new ExtractTextPlugin({
                filename: 'app.[contenthash:15].css',
                allChunks: true,
                disable: !options.build,
            }),
            // External svg sprite plugin
            new SvgStorePlugin(),
            // Minify JS
            options.minify && new UglifyJsPlugin({
                mangle: true,
                compress: {
                    warnings: false,      // Mute warnings
                    drop_console: true,   // Drop console.* statements
                    drop_debugger: true,  // Drop debugger statements
                    screw_ie8: true,      // We don't support IE8 and lower, this further improves compression
                },
            }),
        ].filter((val) => val),
        devtool: options.build ? 'source-map' : 'eval-source-map',
    };
};
