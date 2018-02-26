/* eslint-disable camelcase */

const path = require('path');
const sameOrigin = require('same-origin');
const constants = require('../../util/constants');
const { getEnvVariables, inlineEnvVariables } = require('./util/env');

// Webpack plugins
const SvgStorePlugin = require('external-svg-sprite-loader/lib/SvgStorePlugin');
const NamedModulesPlugin = require('webpack/lib/NamedModulesPlugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');
const NoEmitOnErrorsPlugin = require('webpack/lib/NoEmitOnErrorsPlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const ModuleConcatenationPlugin = require('webpack/lib/optimize/ModuleConcatenationPlugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');

module.exports = ({ minify } = {}) => {
    const {
        NODE_ENV: env,
        SITE_URL: siteUrl,
        PUBLIC_URL: publicUrl,
    } = process.env;
    const isDev = env === 'development';
    const envVars = getEnvVariables();

    return {
        context: constants.projectDir,
        entry: {
            main: [
                require.resolve('dom4'), // Adds dom4 polyfills, such as Element.remove(), etc
                isDev && require.resolve('eventsource-polyfill'), // Necessary to make hmr work on IE
                isDev && require.resolve('core-js/modules/es6.symbol'), // Necessary to get around an issue with `react-hot-loader` requiring react, see: https://github.com/facebook/react/issues/8379#issuecomment-309916013
                isDev && require.resolve('react-hot-loader/patch'), // For hot module reload
                isDev && `${require.resolve('webpack-hot-middleware/client')}?reload=true`, // For hot module reload
                require.resolve('svgxuse'), // Necessary because external svgs need a polyfill in IE
                constants.entryClientFile,
            ]
            .filter((file) => file),
        },
        output: {
            path: path.join(constants.publicDir, 'build'),
            publicPath: `${publicUrl}/build/`,
            filename: isDev ? 'js/[name].js' : 'js/[name].[chunkhash].js',
            chunkFilename: isDev ? 'js/chunk.[name].js' : 'js/chunk.[name].[chunkhash].js',
            hotUpdateChunkFilename: '[id].hot-update.js',
            hotUpdateMainFilename: 'hot-update.json',
        },
        resolve: {
            alias: {
                shared: path.join(constants.srcDir, 'shared'),
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
                                cacheDirectory: true,
                                presets: [
                                    [require.resolve('babel-preset-moxy'), {
                                        targets: ['browser'],
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
                // CSS files loader which enables the use of postcss & cssnext
                {
                    test: /\.css$/,
                    loader: ExtractTextPlugin.extract({
                        fallback: {
                            loader: require.resolve('style-loader'),
                            options: {
                                convertToAbsoluteUrls: isDev,
                            },
                        },
                        use: [
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
                                    importPath: path.join(constants.srcDir, 'shared/styles/imports'),
                                }),
                            },
                        ],
                    }),
                },
                // Load SVG files and create an external sprite
                // While this has a lot of advantages such as not blocking the initial load,
                // it might not workout for every SVG, see: https://github.com/moxystudio/react-with-moxy/issues/6
                {
                    test: /\.svg$/,
                    exclude: [/\.inline\.svg$/, path.join(constants.srcDir, 'shared/media/fonts')],
                    use: [
                        {
                            loader: require.resolve('external-svg-sprite-loader'),
                            options: {
                                name: isDev ? 'images/svg-sprite.svg' : 'images/svg-sprite.[hash:15].svg',
                                // Force publicPath to be local because external SVGs doesn't work on CDNs
                                ...!sameOrigin(publicUrl, siteUrl) ? { publicPath: `${siteUrl}/build/` } : {},
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
            // Ensures that files with NO errors are produced
            new NoEmitOnErrorsPlugin(),
            // Configure debug & minimize
            new LoaderOptionsPlugin({
                minimize: minify,
                debug: isDev,
            }),
            // Add support for environment variables under `process.env`
            // Also replace `typeof window` so that code branch elimination is performed by uglify at build time
            new DefinePlugin({
                ...inlineEnvVariables(envVars, { includeProcessEnv: true }),
                'typeof window': '"object"',
            }),
            // Enabling gives us better debugging output
            new NamedModulesPlugin(),
            // Enable scope hoisting which reduces bundle size, disable in development to increase (re)build performance
            !isDev && new ModuleConcatenationPlugin(),
            // Ensures that hot reloading works
            isDev && new HotModuleReplacementPlugin(),
            // Alleviate cases where developers working on OSX, which does not follow strict path case sensitivity
            new CaseSensitivePathsPlugin(),
            // At the moment we only generic a single app CSS file which is kind of bad, see: https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/332
            new ExtractTextPlugin({
                filename: 'css/main.[contenthash:15].css',
                allChunks: true,
                disable: isDev,
            }),
            // External svg sprite plugin
            new SvgStorePlugin(),
            // Minify JS
            minify && new UglifyJsPlugin({
                sourceMap: true,
                extractComments: true,
                parallel: true,
                cache: true,
                uglifyOptions: {
                    mangle: true,
                    compress: {
                        warnings: false, // Mute warnings
                        drop_console: true, // Drop console.* statements
                        drop_debugger: true, // Drop debugger statements
                    },
                },
            }),
        ].filter((val) => val),
        devtool: isDev ? 'cheap-module-source-map' : 'source-map',
    };
};
