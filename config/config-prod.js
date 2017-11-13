'use strict';

const merge = require('lodash/merge');
const baseConfig = require('./config');

// Configuration for the prod environment goes here,
// including possible overrides to the base configuration

const config = merge({}, baseConfig, {
    env: 'prod',

    googleTrackingId: 'UA-XXXXXX',
});

module.exports = config;
