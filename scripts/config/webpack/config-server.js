/* eslint camelcase:0, global-require:0 */

const path = require('path');
const sameOrigin = require('same-origin');
const constants = require('../../util/constants');
const definePluginEnv = require('./util/definePluginEnv');

// Webpack plugins
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const SvgStorePlugin = require('external-svg-sprite-loader/lib/SvgStorePlugin');
const NamedModulesPlugin = require('webpack/lib/NamedModulesPlugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const NoEmitOnErrorsPlugin = require('webpack/lib/NoEmitOnErrorsPlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const ModuleConcatenationPlugin = require('webpack/lib/optimize/ModuleConcatenationPlugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');

module.exports = ({ minify } = {}) => {
    const {
        NODE_ENV: env,
        PUBLIC_URL: publicUrl,
        PUBLIC_ASSETS_URL: publicAssetsUrl,
    } = process.env;
    const isDev = env === 'development';

    return {
        context: constants.projectDir,
        entry: {
            'server-bundle': [
                // 'babel-polyfill', // Do not uncomment, included only once in server and server-dev
                constants.entryServerFile,
            ],
        },
        output: {
            path: `${constants.publicDir}/build/`,
            publicPath: `${publicAssetsUrl}/`,
            filename: '[name].js',
            libraryTarget: 'this',
        },
        resolve: {
            alias: {
                shared: path.join(constants.srcDir, 'shared'),
            },
        },
        target: 'node', // Need this for certain libraries such as 'axios' to work
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
                            loader: require.resolve('babel-loader'),
                            options: {
                                cacheDirectory: true,
                                presets: [
                                    [require.resolve('babel-preset-moxy'), {
                                        targets: ['node'],
                                        react: true,
                                    }],
                                ],
                                plugins: [
                                    // Necessary for import() to work
                                    require.resolve('babel-plugin-dynamic-import-node'),
                                    // <3 hot module reload
                                    isDev ? require.resolve('react-hot-loader/babel') : null,
                                ]
                                .filter((plugin) => plugin),
                            },
                        },
                        // Enable preprocess-loader so that we can use @ifdef SYNC_ROUTES when declaring routes
                        // See: https://github.com/gaearon/react-hot-loader/issues/288#issuecomment-281372266
                        {
                            loader: require.resolve('preprocess-loader'),
                            options: {
                                SYNC_ROUTES: true,
                            },
                        },
                    ],
                },
                // CSS files loader which enables the use of postcss & cssnext
                {
                    test: /\.css$/,
                    loader: ExtractTextPlugin.extract({
                        use: [
                            {
                                // When building, we do not want to include the CSS contents.. the client will be responsible for that
                                loader: !isDev ? require.resolve('css-loader/locals') : require.resolve('css-loader'),
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
                                options: {
                                    plugins: [
                                        // Let postcss parse @import statements
                                        require('postcss-import')({
                                            // Any non-relative imports are resolved to this path
                                            path: `${constants.srcDir}/shared/styles/imports`,
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
                    exclude: [/\.inline\.svg$/, `${constants.srcDir}/shared/media/fonts`],
                    use: [
                        {
                            loader: require.resolve('external-svg-sprite-loader'),
                            options: {
                                name: isDev ? 'images/svg-sprite.svg' : 'images/svg-sprite.[hash:15].svg',
                                // Force publicPath to be local because external SVGs doesn't work on CDNs
                                ...!sameOrigin(publicAssetsUrl, publicUrl) ? { publicPath: `${publicUrl}/build/` } : {},
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
                // Raster images (png, jpg, etc)
                {
                    test: /\.(png|jpg|jpeg|gif|webp)$/,
                    loader: require.resolve('file-loader'),
                    options: {
                        name: isDev ? 'images/[name].[ext]' : 'images/[name].[hash:15].[ext]',
                        emitFile: false,
                    },
                },
                // Web fonts
                {
                    test: /\.(eot|ttf|woff|woff2|otf)$/,
                    loader: require.resolve('file-loader'),
                    options: {
                        name: isDev ? 'fonts/[name].[ext]' : 'fonts/[name].[hash:15].[ext]',
                        emitFile: false,
                    },
                },
                // Audio & video
                {
                    test: /\.(mp3|flac|wav|aac|ogg|oga|mp4|webm|ogv)$/,
                    loader: require.resolve('file-loader'),
                    options: {
                        name: isDev ? 'playback/[name].[ext]' : 'playback/[name].[hash:15].[ext]',
                        emitFile: false,
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
                ...definePluginEnv(),
                'typeof window': '"undefined"',
            }),
            // Add module names to factory functions so they appear in browser profiler
            new NamedModulesPlugin(),
            // Enable scope hoisting which reduces bundle size
            new ModuleConcatenationPlugin(),
            // Alleviate cases where developers working on OSX, which does not follow strict path case sensitivity
            new CaseSensitivePathsPlugin(),
            // At the moment we only generic a single app CSS file which is kind of bad, see: https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/332
            new ExtractTextPlugin({
                filename: 'css/main.css',
                allChunks: true,
                disable: !isDev,
            }),
            // External svg sprite plugin
            new SvgStorePlugin({ emit: false }),
            // Minify JS
            minify && new UglifyJsPlugin({
                extractComments: true,
                parallel: true,
                cache: true,
                uglifyOptions: {
                    mangle: true,
                    compress: {
                        warnings: false,     // Mute warnings
                        drop_console: true,  // Drop console.* statements
                        drop_debugger: true, // Drop debugger statements
                    },
                },
            }),
        ].filter((val) => val),
        devtool: false, // No source maps on the server for now
    };
};
