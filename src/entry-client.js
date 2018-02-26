import 'babel-polyfill';
import React from 'react';
import { hydrate } from 'react-dom';
import { match, Router, browserHistory as history, applyRouterMiddleware } from 'react-router';
import { useScroll } from 'react-router-scroll';
import nprogress from 'nprogress';
import { AppContainer } from 'react-hot-loader';
import { buildRoutes } from './App';

const isDev = process.env.NODE_ENV === 'development';
const { internalServerError } = window.__ISOMORPHIC_STATE__ || {};

// Allow the isomorphic state to be garbage-collected on non-dev environments
!isDev && delete window.__ISOMORPHIC_STATE__;

// Track page views for this SPA in Google Analytics
history.listen((location) => {
    if (window.ga) {
        window.ga('set', 'page', `${location.pathname + location.search}`);
        window.ga('send', 'pageview');
    }
});

// Configure nprogress, see: https://github.com/rstacruz/nprogress
nprogress.configure({ minimum: 0.15, showSpinner: false, speed: 500 });

// Build our routes
const routes = buildRoutes();
// Set location to /internal-error if we had an internal server error
const location = internalServerError ? '/internal-error' : undefined;

// Render our app!
// Need to use match() because of async routes, see https://github.com/ReactTraining/react-router/blob/master/docs/guides/ServerRendering.md#async-routes
match({ history, routes, location }, (error, redirectLocation, renderProps) => {
    hydrate(
        <AppContainer>
            <Router
                { ...renderProps }
                history={ history }
                routes={ routes }
                render={ applyRouterMiddleware(useScroll()) } />
        </AppContainer>,
        document.getElementById('root'),
        () => {
            // Remove server-side rendered CSS when developing, otherwise CSS styles would be duplicated
            if (process.env.NODE_ENV === 'development') {
                setTimeout(() =>
                    Array.from(document.querySelectorAll('link[rel="stylesheet"][data-ssr]'))
                    .forEach((el) => el.remove()), 100);
            }
        }
    );
});

if (process.env.NODE_ENV === 'development' && module.hot) {
    // Hot module reload for App and its routes
    module.hot.accept('./App', () => {
        const buildRoutes = require('./App').buildRoutes; // eslint-disable-line prefer-import/prefer-import-over-require
        const routes = buildRoutes();

        hydrate(
            <AppContainer>
                <Router
                    history={ history }
                    routes={ routes }
                    render={ applyRouterMiddleware(useScroll()) } />
            </AppContainer>,
            document.getElementById('root'),
        );
    });

    // Brace yourselves, hack below!
    // While HMRE works, react-router does a console.error because it's routes prop changed
    // We monkey-patch console.error to ignore that error.. I know that it's a hack, but it works!
    // See: https://github.com/gaearon/react-hot-loader/issues/298
    // See: https://github.com/ReactTraining/react-router/issues/2704
    const originalError = console.error;

    console.error = (...args) => {
        if (typeof args[0] !== 'string' || args[0].indexOf('You cannot change <Router routes>;') === -1) {
            originalError.apply(console, args);
        }
    };
}
