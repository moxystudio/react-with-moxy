/* eslint-disable camelcase */

const path = require('path');
const sameOrigin = require('same-origin');
const constants = require('../../util/constants');
const queryString = require('query-string');
const { getEnvVariables, inlineEnvVariables } = require('./util/env');

// Webpack plugins
const DefinePlugin = require('webpack/lib/DefinePlugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const SvgStorePlugin = require('external-svg-sprite-loader/lib/SvgStorePlugin');
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
        mode: isDev ? 'development' : 'production',
        entry: {
            // The `entry-points/serverEnv` entrypoint copies the read-only env variables into `process-env`
            'server-bundle': [
                `${require.resolve('./entry-points/serverEnv')}?${queryString.stringify(envVars)}`,
                constants.entryServerFile,
            ],
        },
        output: {
            path: path.join(constants.publicDir, 'build'),
            publicPath: `${publicUrl}/build/`,
            filename: '[name].js',
            libraryTarget: 'this',
        },
        target: 'node',
        node: {
            // Need this to properly set __dirname and __filename
            __dirname: false,
            __filename: false,
        },
        resolve: {
            alias: {
                shared: path.join(constants.srcDir, 'shared'),
                // Ensure that any dependency using `babel-runtime/regenerator` maps to `regenerator-runtime`
                // This guarantees that there is no `regenerator-runtime` duplication in the build in case the versions differ
                'babel-runtime/regenerator': require.resolve('regenerator-runtime'),
            },
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
                                        namedDefaultExport: false,
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
                                options: require('postcss-preset-moxy')({
                                    // Any non-relative imports are resolved to this path
                                    importPath: path.join(constants.srcDir, 'shared/styles/imports'),
                                }),
                            },
                        ],
                    }),
                },
                // Load SVG files and create an external sprite
                // While this has a lot of advantages, such as not blocking the initial load, it can't contain
                // inline SVGs, see: https://github.com/moxystudio/react-with-moxy/issues/6
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
                    test: /\.(mp3|flac|wav|aac|ogg|oga|mp4|m4a|webm|ogv)$/,
                    loader: require.resolve('file-loader'),
                    options: {
                        name: isDev ? 'playback/[name].[ext]' : 'playback/[name].[hash:15].[ext]',
                        emitFile: false,
                    },
                },
            ],
        },
        plugins: [
            // If the targets specified in `babel-preset-env` already support `async await` natively, such as Nodejs >= v8,
            // the `regenerator-runtime` won't be installed automatically
            // This is fine, except if your app uses dependencies that rely on the `regeneratorRuntime` global
            // We use `ProvidePlugin` to provide `regeneratorRuntime` to those dependencies
            new ProvidePlugin({
                regeneratorRuntime: require.resolve('regenerator-runtime'),
            }),
            // Add support for environment variables under `process.env`
            // Also replace `typeof window` so that code branch elimination is performed by uglify at build time
            new DefinePlugin({
                ...inlineEnvVariables(envVars),
                'typeof window': '"undefined"',
            }),
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
        ].filter((val) => val),
        devtool: isDev ? 'cheap-module-eval-source-map' : 'nosources-source-map',
        optimization: {
            minimize: minify,
            minimizer: [
                new UglifyJsPlugin({
                    sourceMap: true,
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
            ],
        },
        performance: {
            maxEntrypointSize: Infinity,
            maxAssetSize: 600000,
        },
    };
};
