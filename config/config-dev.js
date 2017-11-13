'use strict';

const merge = require('lodash/merge');
const baseConfig = require('./config');

// Configuration for the dev environment goes here,
// including possible overrides to the base configuration

const config = merge({}, baseConfig, {
    env: 'dev',
});

module.exports = config;
