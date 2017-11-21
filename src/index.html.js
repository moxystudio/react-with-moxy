import config from 'shared/config';

export default function renderDocument({ helmet, rootHtml, buildManifest }) {
    const { assets } = buildManifest;

    return `
        <!DOCTYPE html>
        <html ${helmet.htmlAttributes.toString()}>
            <head>
                <meta charset="utf-8">
                <meta http-equiv="x-ua-compatible" content="ie=edge">
                <meta id="viewport" name="viewport" content="width=device-width,initial-scale=1" />

                ${helmet.title.toString()}
                ${helmet.meta.toString()}
                ${helmet.link.toString()}

                <!-- Roboto from Google-->
                <link href="https://fonts.googleapis.com/css?family=Roboto:400,500,700" rel="stylesheet">

                <!-- Load CSS assets -->
                ${assets.css.map((asset) => `<link data-ssr rel="stylesheet" href="${asset.url}">`).join('\n')}
                <!-- Preload secondary assets -->
                ${assets.secondary.map((asset) => `<link rel="prefetch" href="${asset.url}">`).join('\n')}
            </head>
            <body>
                <!-- Root element where app goes -->
                <div id="root">${rootHtml}</div>

                <!-- Load JS assets -->
                ${assets.js.map((asset) => `<script src="${asset.url}"></script>`).join('\n')}

                ${config.googleTrackingCode ? `
                <!-- Google Analytics -->
                <script>
                (function(b,o,i,l,e,r){b.GoogleAnalyticsObject=l;b[l]||(b[l]=
                function(){(b[l].q=b[l].q||[]).push(arguments)});b[l].l=+new Date;
                e=o.createElement(i);r=o.getElementsByTagName(i)[0];
                e.src='https://www.google-analytics.com/analytics.js';
                r.parentNode.insertBefore(e,r)}(window,document,'script','ga'));
                ga('create','${config.googleTrackingCode}','auto');ga('send','pageview');
                </script>
                ` : ''}
            </body>
        </html>
    `;
}
