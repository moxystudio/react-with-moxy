const path = require('path');
const { projectDir, srcDir, entryClientFile, entryServerFile } = require('../../util/constants');

module.exports = {
    rootDir: projectDir,
    testEnvironment: 'jsdom',
    testMatch: [`${srcDir}/**/*.test.js`],
    testPathIgnorePatterns: ['node_modules'],

    transform: {
        '\\.js$': require.resolve('./transformer'),
        '\\.(png|jpg|jpeg|gif|inline\\.svg)$': require.resolve('jest-file'), // Only inline svgs are targeted
        '\\.(webp|eot|ttf|woff|woff2|otf)$': require.resolve('jest-file'),
        '\\.(mp3|flac|wav|aac|ogg|oga|mp4|webm|ogv)$': require.resolve('jest-file'),
    },
    transformIgnorePatterns: [
        'node_modules',
    ],

    setupFiles: [require.resolve('./setup')],
    setupTestFrameworkScriptFile: require.resolve('jest-enzyme'),

    moduleFileExtensions: ['js', 'json'],
    moduleNameMapper: {
        '\\.css$': require.resolve('identity-obj-proxy'),
        '(?!.*?inline\\.svg)^.*\\.svg$': require.resolve('identity-obj-proxy'), // Ignore inline SVGs
        '^shared/(.*)$': path.join(srcDir, 'shared/$1'),
    },
    moduleDirectories: ['node_modules'],

    collectCoverage: true,
    collectCoverageFrom: [`${path.relative(projectDir, srcDir)}/**/*.js`],
    coveragePathIgnorePatterns: [
        entryClientFile,
        entryServerFile,
    ],
};
