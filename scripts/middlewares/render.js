const { compose } = require('compose-middleware');
const interceptor = require('express-interceptor');
const nocache = require('nocache')();

function render() {
    return compose([
        // Set no-cache unless a specific page defined a cache-control policy
        interceptor((req, res) => ({
            isInterceptable: () => !res.get('cache-control'),
            intercept: (body, send) => nocache(req, res, () => send(body)),
        })),
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
