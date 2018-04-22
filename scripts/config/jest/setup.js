/* global document:false */

'use strict';

// Add request animation frame which is required by react
require('raf/polyfill');

// Setup enzyme
const { configure: configureEnzyme } = require('enzyme');
const EnzymeAdapter = require('enzyme-adapter-react-16');

configureEnzyme({ adapter: new EnzymeAdapter() });

// Setup document
document.documentElement.innerHTML = `
<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
    </head>
    <body>
    </body>
</html>
`;

// JSDOM doesn't provide all the features that `window` has
// See https://github.com/tmpvar/jsdom/blob/6164c93266c9a70fb5003c5d7a2608a9766e9ed2/lib/jsdom/browser/Window.js#L520
// You may add mocks to those features below
