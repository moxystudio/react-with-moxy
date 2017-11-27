import 'babel-polyfill';
import React from 'react';
import { renderToNodeStream } from 'react-dom/server';
import promiseFromStream from 'promise-from-stream';
import { match, RouterContext, createMemoryHistory } from 'react-router';
import Helmet from 'react-helmet';
import pify from 'pify';
import { buildRoutes } from './App';
import { openDocument, closeDocument } from './index.html';

const matchAsync = pify(match, { multiArgs: true });

// Build our routes
const routes = buildRoutes();

export async function render({ req, res, buildManifest }) {
    // Match req against our routes
    const history = createMemoryHistory();
    const [redirectLocation, renderProps] = await matchAsync({ history, routes, location: req.url });

    // Is it to redirect?
    if (redirectLocation) {
        return res.redirect(redirectLocation.pathname + redirectLocation.search);
    }
    // 404? This shouldn't happen because we have a react-router catch all route, but just in case..
    if (!renderProps) {
        return res.status(404).end();
    }

    // Render initial part of the document
    res.write(openDocument({ helmet: Helmet.renderStatic(), buildManifest }));

    // Render HTML that goes to into <div id="root"></div>
    const rootHtmlStream = renderToNodeStream(
        <RouterContext
            { ...renderProps }
            createElement={ (Component, props) => <Component { ...props } serverContext={ { req, res } } /> } />
    );

    rootHtmlStream.pipe(res, { end: false });
    await promiseFromStream(rootHtmlStream);

    // Finally close the document
    res.write(closeDocument({ buildManifest }));
    res.end();
}

export async function renderError({ err, req, res, buildManifest }) {
    // Match req against our routes
    const history = createMemoryHistory();
    const [redirectLocation, renderProps] = await matchAsync({ history, routes, location: '/internal-error' });

    // Is it to redirect?
    if (redirectLocation) {
        return res.redirect(redirectLocation.pathname + redirectLocation.search);
    }
    // If there's no error page, render a generic one
    if (!renderProps) {
        throw err;
    }

    // Render initial part of the document
    res.write(openDocument({ helmet: Helmet.renderStatic(), buildManifest }));

    // Render HTML that goes to into <div id="root"></div>
    const rootHtmlStream = renderToNodeStream(
        <RouterContext
            { ...renderProps }
            createElement={ (Component, props) => <Component { ...props } serverContext={ { req, res } } /> } />
    );

    rootHtmlStream.pipe(res, { end: false });

    await promiseFromStream(rootHtmlStream);

    // Finally close the document
    res.write(closeDocument({ buildManifest }));
    res.end();
}
