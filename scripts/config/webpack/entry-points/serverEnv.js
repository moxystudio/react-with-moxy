/* global __resourceQuery:false */

import queryString from 'query-string';

// Check if `process` and `__resourceQuery` are defined, just for safety.
if (typeof process !== 'undefined' && __resourceQuery) {
    Object.assign(process.env, queryString.parse(__resourceQuery));
}
