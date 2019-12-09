/* eslint-disable camelcase */

'use strict';

const path = require('path');
const sameOrigin = require('same-origin');
const queryString = require('query-string');
const { getEnvVariables, inlineEnvVariables } = require('./util/env');
const { projectDir, buildDir, buildUrlPath, srcDir, entryServerFile } = require('../../util/constants');

// Webpack plugins
const DefinePlugin = require('webpack/lib/DefinePlugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const SvgStorePlugin = require('external-svg-sprite-loader');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const IgnoreEmitPlugin = require('ignore-emit-webpack-plugin');

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
            // The `entry-points/serverEnv` entrypoint copies the read-only env variables into `process-env`
            'server-bundle': [
                `${require.resolve('./entry-points/serverEnv')}?${queryString.stringify(envVars)}`,
                entryServerFile,
            ],
        },
        output: {
            path: buildDir,
            publicPath: `${publicUrl + buildUrlPath}/`,
            filename: '[name].js',
            chunkFilename: '[name].js',
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
                shared: path.join(srcDir, 'shared'),
                // Ensure that any dependency using `babel-runtime/regenerator` maps to `regenerator-runtime`
                // This guarantees that there is no `regenerator-runtime` duplication in the build in case the versions differ
                'babel-runtime/regenerator': require.resolve('regenerator-runtime'),
            },
            symlinks: false,
        },
        module: {
            rules: [
                // Babel loader enables us to use new ECMA features + react's JSX
                {
                    test: /\.js$/,
                    use: [
                        {
                            loader: require.resolve('babel-loader'),
                            options: {
                                cacheDirectory: path.join(projectDir, 'node_modules/.cache/babel-loader-server'),
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
                // CSS files loader which enables the use of postcss
                {
                    test: /\.css$/,
                    loader: [
                        // Extract CSS files if we are in development mode, so that SSR comes with styles
                        isDev && {
                            loader: MiniCssExtractPlugin.loader,
                        },
                        {
                            // In production, we don't want to have the CSS styles in the server-bundle
                            loader: isDev ? require.resolve('css-loader') : require.resolve('css-loader/locals'),
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
                    ].filter((val) => val),
                },
                // Load SVG files and create an external sprite
                // While this has a lot of advantages, such as not blocking the initial load, it can't contain
                // inline SVGs, see: https://github.com/moxystudio/react-with-moxy/issues/6
                {
                    test: /\.svg$/,
                    exclude: [/\.inline\.svg$/, path.join(srcDir, 'shared/media/fonts')],
                    use: [
                        {
                            loader: SvgStorePlugin.loader,
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
            // Also replace `typeof window` so that code branch elimination is performed by terser at build time
            new DefinePlugin({
                ...inlineEnvVariables(envVars),
                'typeof window': '"undefined"',
            }),
            // Alleviate cases where developers working on OSX, which does not follow strict path case sensitivity
            new CaseSensitivePathsPlugin(),
            // Extract CSS files if we are in development mode, so that SSR comes with styles
            isDev && new MiniCssExtractPlugin({
                filename: 'css/main.css',
                chunkFilename: 'css/[name].css',
            }),
            // Ignore the emitted `styles.js` file that originated from a bug in `splitChunks`,
            // see: https://github.com/webpack-contrib/mini-css-extract-plugin/issues/151#issuecomment-402336362
            isDev && new IgnoreEmitPlugin([/^styles\.js(\.map)?$/]),
            // External svg sprite plugin
            new SvgStorePlugin({ emit: false }),
        ].filter((val) => val),
        devtool: isDev ? 'cheap-module-eval-source-map' : 'nosources-source-map',
        optimization: {
            minimize: minify,
            minimizer: [
                new TerserPlugin({
                    sourceMap: true,
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
                    ...(!isDev ? {} : {
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
            maxEntrypointSize: Infinity,
            maxAssetSize: 600000,
        },
    };
};
