const { compose } = require('compose-middleware');
const wrap = require('lodash/wrap');

function render() {
    return compose([
        // Disable browser caching unless a specific page defined a cache-control policy
        (req, res, next) => {
            res.writeHead = wrap(res.writeHead, (writeHeaders, ...args) => {
                if (!res.get('Cache-control')) {
                    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
                }

                writeHeaders.apply(res, args);
            });
            next();
        },
        // Call `render()` from the server bundle
        (req, res, next) => {
            const { exports, buildManifest } = res.locals.isomorphicCompilation;

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

        const { exports, buildManifest } = res.locals.isomorphicCompilation;

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
