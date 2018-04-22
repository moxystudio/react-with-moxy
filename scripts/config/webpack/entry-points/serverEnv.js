/* global __resourceQuery:false */

'use strict';

const queryString = require('query-string');

// Check if `process` and `__resourceQuery` are defined, just for safety.
if (typeof process !== 'undefined' && __resourceQuery) {
    Object.assign(process.env, queryString.parse(__resourceQuery));
}
