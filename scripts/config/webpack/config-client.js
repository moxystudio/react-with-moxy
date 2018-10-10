/* eslint-disable camelcase */

'use strict';

const path = require('path');
const sameOrigin = require('same-origin');
const mimeDb = require('mime-db');
const { projectDir, buildDir, buildUrlPath, serviceWorkerFile, srcDir, entryClientFile } = require('../../util/constants');
const { getEnvVariables, inlineEnvVariables } = require('./util/env');

// Webpack plugins
const DefinePlugin = require('webpack/lib/DefinePlugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');
const SvgStorePlugin = require('external-svg-sprite-loader/lib/SvgStorePlugin');
const BannerPlugin = require('webpack/lib/BannerPlugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const IgnoreEmitPlugin = require('ignore-emit-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const brotliCompress = require('iltorb').compress;
const WorkboxPlugin = require('workbox-webpack-plugin');

const compressibleRegExps = Object.values(mimeDb)
.filter((mime) => mime.compressible && mime.extensions)
.reduce((extensions, mime) => {
    mime.extensions.forEach((ext) => extensions.push(new RegExp(`\\.${ext}`)));

    return extensions;
}, []);

module.exports = ({ minify } = {}) => {
    const {
        NODE_ENV: env,
        SITE_URL: siteUrl,
        PUBLIC_URL: publicUrl,
    } = process.env;
    const isDev = env === 'development';
    const envVars = getEnvVariables();

    return {
        context: projectDir,
        mode: isDev ? 'development' : 'production',
        entry: {
            main: [
                require.resolve('dom4'), // Adds dom4 polyfills, such as Element.remove(), etc
                isDev && require.resolve('eventsource-polyfill'), // Necessary to make hmr work on IE
                isDev && require.resolve('core-js/modules/es6.symbol'), // Necessary to get around an issue with `react-hot-loader` requiring react, see: https://github.com/facebook/react/issues/8379#issuecomment-309916013
                isDev && require.resolve('webpack-hot-middleware/client'), // For hot module reload
                require.resolve('svgxuse'), // Necessary because external svgs need a polyfill in IE
                entryClientFile,
            ]
            .filter((file) => file),
        },
        output: {
            path: buildDir,
            publicPath: `${publicUrl + buildUrlPath}/`,
            filename: isDev ? 'js/[name].js' : 'js/[name].[chunkhash:15].js',
            chunkFilename: isDev ? 'js/[name].js' : 'js/[name].[chunkhash:15].js',
            hotUpdateChunkFilename: '[id].hot-update.js',
            hotUpdateMainFilename: 'hot-update.json',
        },
        resolve: {
            alias: {
                shared: path.join(srcDir, 'shared'),
                // Ensure that any dependency using `babel-runtime/regenerator` maps to `regenerator-runtime`
                // This guarantees that there is no `regenerator-runtime` duplication in the build in case the versions differ
                'babel-runtime/regenerator': require.resolve('regenerator-runtime'),
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
                            loader: require.resolve('babel-loader'),
                            options: {
                                cacheDirectory: path.join(projectDir, 'node_modules/.cache/babel-loader-client'),
                                presets: [
                                    [require.resolve('babel-preset-moxy'), {
                                        targets: ['browsers'],
                                        react: true,
                                        modules: false,
                                    }],
                                ],
                                plugins: [
                                    // Necessary for import() to work
                                    require.resolve('babel-plugin-syntax-dynamic-import'),
                                    // <3 hot module reload
                                    isDev ? require.resolve('react-hot-loader/babel') : null,
                                ]
                                .filter((plugin) => plugin),
                            },
                        },
                        // Enable preprocess-loader so that we can use @ifdef DEV when declaring routes
                        // See: https://github.com/gaearon/react-hot-loader/issues/288#issuecomment-281372266
                        {
                            loader: require.resolve('preprocess-loader'),
                            options: {
                                SYNC_ROUTES: isDev ? true : undefined,
                            },
                        },
                    ],
                },
                // CSS files loader which enables the use of postcss
                {
                    test: /\.css$/,
                    loader: [
                        {
                            // Extract CSS files if we are not in development mode
                            loader: isDev ? require.resolve('style-loader') : MiniCssExtractPlugin.loader,
                            options: {
                                convertToAbsoluteUrls: isDev,
                            },
                        },
                        {
                            loader: require.resolve('css-loader'),
                            options: {
                                modules: true,
                                sourceMap: true,
                                importLoaders: 1,
                                camelCase: 'dashes',
                                localIdentName: '[name]__[local]___[hash:base64:5]!',
                            },
                        },
                        {
                            loader: require.resolve('postcss-loader'),
                            options: require('postcss-preset-moxy')({
                                // Any non-relative imports are resolved to this path
                                importPath: path.join(srcDir, 'shared/styles/imports'),
                            }),
                        },
                    ],
                },
                // Load SVG files and create an external sprite
                // While this has a lot of advantages such as not blocking the initial load,
                // it might not workout for every SVG, see: https://github.com/moxystudio/react-with-moxy/issues/6
                {
                    test: /\.svg$/,
                    exclude: [/\.inline\.svg$/, path.join(srcDir, 'shared/media/fonts')],
                    use: [
                        {
                            loader: require.resolve('external-svg-sprite-loader'),
                            options: {
                                name: isDev ? 'images/svg-sprite.svg' : 'images/svg-sprite.[hash:15].svg',
                                // Force publicPath to be local because external SVGs doesn't work on CDNs
                                ...!sameOrigin(publicUrl, siteUrl) ? { publicPath: `${siteUrl + buildUrlPath}/` } : {},
                            },
                        },
                        // Uniquify classnames and ids so that if svgxuse injects the sprite into the body,
                        // it doesn't cause DOM conflicts
                        {
                            loader: require.resolve('svg-css-modules-loader'),
                            options: {
                                transformId: true,
                            },
                        },
                    ],
                },
                // Loader for inline SVGs to support SVGs that do not integrate well with external-svg-sprite-loader,
                // see: https://github.com/moxystudio/react-with-moxy/issues/6
                {
                    test: /\.inline\.svg$/,
                    use: [
                        require.resolve('raw-loader'),
                        {
                            loader: require.resolve('svgo-loader'),
                            options: {
                                plugins: [
                                    { removeTitle: true },
                                    { removeViewBox: false },
                                    { removeDimensions: true },
                                    { cleanupIDs: false },
                                ],
                            },
                        },
                        // Uniquify classnames and ids so they don't conflict with eachother
                        {
                            loader: require.resolve('svg-css-modules-loader'),
                            options: {
                                transformId: true,
                            },
                        },
                    ],
                },
                // Raster images (png, jpg, etc)
                {
                    test: /\.(png|jpg|jpeg|gif|webp)$/,
                    loader: require.resolve('file-loader'),
                    options: {
                        name: isDev ? 'images/[name].[ext]' : 'images/[name].[hash:15].[ext]',
                    },
                },
                // Web fonts
                {
                    test: /\.(eot|ttf|woff|woff2|otf)$/,
                    loader: require.resolve('file-loader'),
                    options: {
                        name: isDev ? 'fonts/[name].[ext]' : 'fonts/[name].[hash:15].[ext]',
                    },
                },
                // Audio & video
                {
                    test: /\.(mp3|flac|wav|aac|ogg|oga|mp4|m4a|webm|ogv)$/,
                    loader: require.resolve('file-loader'),
                    options: {
                        name: isDev ? 'playback/[name].[ext]' : 'playback/[name].[hash:15].[ext]',
                    },
                },
            ],
        },
        plugins: [
            // If the targets specified in `babel-preset-env` already support `async await` natively, such as latest Chrome,
            // the `regenerator-runtime` won't be installed automatically
            // This is fine, except if your app uses dependencies that rely on the `regeneratorRuntime` global
            // We use `ProvidePlugin` to provide `regeneratorRuntime` to those dependencies
            new ProvidePlugin({
                regeneratorRuntime: require.resolve('regenerator-runtime'),
            }),
            // Add support for environment variables under `process.env`
            // Also replace `typeof window` so that code branch elimination is performed by terser at build time
            new DefinePlugin({
                ...inlineEnvVariables(envVars, { includeProcessEnv: true }),
                'typeof window': '"object"',
            }),
            // Ensures that hot reloading works
            isDev && new HotModuleReplacementPlugin(),
            // Alleviate cases where developers working on OSX, which does not follow strict path case sensitivity
            new CaseSensitivePathsPlugin(),
            // Extract CSS files if we are not in development mode
            !isDev && new MiniCssExtractPlugin({
                filename: 'css/main.[hash:15].css',
                chunkFilename: 'css/[name].[chunkhash:15].css',
            }),
            // Ignore the emitted `styles.js` file that originated from a bug in `splitChunks`,
            // see: https://github.com/webpack-contrib/mini-css-extract-plugin/issues/151#issuecomment-402336362
            // Still we must include the "bootstrap" of the app by injecting the "banner" below,
            // see: https://github.com/webpack-contrib/mini-css-extract-plugin/issues/85#issuecomment-387918944
            !isDev && new IgnoreEmitPlugin([/^js\/styles\.\w+\.js(\.map)?$/]),
            !isDev && new BannerPlugin({
                banner: '(window.webpackJsonp = window.webpackJsonp || []).push([[0], []]);',
                raw: true,
                entryOnly: true,
                include: /js\/main\.\w+\.js$/,
            }),
            // Compressed versions of the assets are produced along with the original files
            // Both gz and br versions of the assets are created
            minify && new CompressionPlugin({
                include: compressibleRegExps,
                exclude: /\.(map|LICENSE)$/,
            }),
            minify && new CompressionPlugin({
                include: compressibleRegExps,
                exclude: /\.(map|LICENSE)$/,
                asset: '[path].br',
                algorithm: (buf, options, callback) => brotliCompress(buf, callback),
            }),
            // External svg sprite plugin
            new SvgStorePlugin(),
            // Plugin to produce the service worker
            new WorkboxPlugin.GenerateSW({
                swDest: serviceWorkerFile,
                importsDirectory: 'sw',
                // Ignore the emitted `styles.js` file that originated from a bug in `splitChunks`,
                // see: https://github.com/webpack-contrib/mini-css-extract-plugin/issues/151#issuecomment-402336362
                // Note that the default exclude argument entries are kept
                exclude: [
                    /\.map$/,
                    /^manifest.*\.js(?:on)?$/,
                    /^js\/styles\.\w+\.js(\.map)?$/,
                ],
                runtimeCaching: [{
                    urlPattern: /.*/,
                    handler: 'networkFirst',
                }],
            }),
        ].filter((val) => val),
        devtool: isDev ? 'cheap-module-eval-source-map' : 'nosources-source-map',
        optimization: {
            minimize: minify,
            minimizer: [
                new TerserPlugin({
                    sourceMap: true,
                    extractComments: true,
                    parallel: true,
                    cache: true,
                    terserOptions: {
                        mangle: true,
                        compress: {
                            warnings: false, // Mute warnings
                            drop_console: true, // Drop console.* statements
                            drop_debugger: true, // Drop debugger statements
                        },
                    },
                }),
            ],
            splitChunks: {
                cacheGroups: {
                    // Generate a single CSS file for now until this is solved,
                    // see https://github.com/moxystudio/react-with-moxy/issues/113
                    ...(isDev ? {} : {
                        styles: {
                            name: 'styles',
                            // Can't use /\.css$/ due to a bug,
                            // see https://github.com/webpack-contrib/mini-css-extract-plugin/issues/85#issuecomment-378673224
                            test: (module) =>
                                module.nameForCondition &&
                                /\.css$/.test(module.nameForCondition()) &&
                                !/^javascript/.test(module.type),
                            chunks: 'all',
                            enforce: true,
                        },
                    }),
                },
            },
        },
        performance: {
            maxEntrypointSize: 600000,
            maxAssetSize: 600000,
        },
    };
};
