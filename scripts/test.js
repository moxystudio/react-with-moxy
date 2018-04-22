#!/usr/bin/env node

'use strict';

require('dotenv').config();

const execa = require('execa');

execa('jest', [
    ...process.argv.slice(2),
    '--config',
    require.resolve('./config/jest'),
], {
    stdio: 'inherit',
})
.catch((err) => {
    process.exit(err.code || 1);
});
