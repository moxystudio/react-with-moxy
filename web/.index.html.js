import difference from 'lodash/difference';

export default function index({ head, rootHtml, config, buildManifest }) {
    const { assets, routes: { sync: syncRoutes, async: asyncRoutes } } = buildManifest;
    const { routesToPrefetch } = config;

    // Warn if any of the routes to prefetch no longer exist
    if (__DEV__) {
        routesToPrefetch
        .forEach((route) => {
            if (!syncRoutes[route] && !asyncRoutes[route]) {
                console.warn(`[index.html.js] Unknown route "${route}" declared in \`config.routesToPrefetch\``);
            }
        });
    }

    return `
        <!DOCTYPE html>
        <html ${head.htmlAttributes.toString()}>
            <head>
                <meta charset="utf-8">
                <meta http-equiv="x-ua-compatible" content="ie=edge">
                <meta id="viewport" name="viewport" content="width=device-width, initial-scale=1" />

                ${head.title.toString()}
                ${head.meta.toString()}
                ${head.link.toString()}

                <!-- Roboto from Google-->
                <link href="https://fonts.googleapis.com/css?family=Roboto:400,500,700" rel="stylesheet">

                <!-- App stylesheet -->
                <link id="app-css" rel="stylesheet" href="${assets['app.css']}">

                <!-- Prefetch routes -->
                ${ routesToPrefetch.map((route) => asyncRoutes[route] ? `<link rel="prefetch" href="${asyncRoutes[route]}">` : '').join('\n') }
            </head>
            <body>
                <!-- Root element where app goes -->
                <div id="root">${rootHtml}</div>

                <!-- Load main file -->
                <script src="${assets['main.js']}"></script>

                ${ assets['deferrable.js'] ? `
                <!-- Load deferrable file -->
                <script src="${assets['deferrable.js']}" async defer></script>` : '' }

                ${config.googleTrackingId ? `
                <!-- Google Analytics -->
                <script>
                (function(b,o,i,l,e,r){b.GoogleAnalyticsObject=l;b[l]||(b[l]=
                function(){(b[l].q=b[l].q||[]).push(arguments)});b[l].l=+new Date;
                e=o.createElement(i);r=o.getElementsByTagName(i)[0];
                e.src='https://www.google-analytics.com/analytics.js';
                r.parentNode.insertBefore(e,r)}(window,document,'script','ga'));
                ga('create','${config.googleTrackingId}','auto');ga('send','pageview');
                </script>
                ` : ''}
            </body>
        </html>
    `;
}
