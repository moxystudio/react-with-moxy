'use strict';

const { compose } = require('compose-middleware');
const wrap = require('lodash/wrap');

function render() {
    return compose([
        // If there's no `Cache-Control` header, assume that the content is private and must be revalidated
        // This allow cached responses to be used if validation, such as ETag, is successful
        // We shouldn't use `no-cache` because some browsers treat it as `no-store`, which forces no cache at all
        (req, res, next) => {
            res.writeHead = wrap(res.writeHead, (writeHeaders, ...args) => {
                if (!res.get('Cache-control')) {
                    res.set('Cache-Control', 'private, max-age=0, must-revalidate');
                }

                writeHeaders.apply(res, args);
            });
            next();
        },
        // Call `render()` from the server bundle
        (req, res, next) => {
            const { exports, buildManifest } = res.locals.isomorphic;

            Promise.resolve(exports.render({ req, res, buildManifest }))
            .catch(next);
        },
    ]);
}

function renderError() {
    // Call `renderError()` on errors
    return (err, req, res, next) => {
        // Skip if response was already sent
        if (res.headersSent) {
            return next(err);
        }

        const { exports, buildManifest } = res.locals.isomorphic || {};

        // Skip if there's no defined `renderError`
        if (!exports || !exports.renderError) {
            return next(err);
        }

        Promise.resolve(exports.renderError({ err, req, res, buildManifest }))
        .catch(next);
    };
}

module.exports = {
    render,
    renderError,
};
