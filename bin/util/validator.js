'use strict';

const fs = require('fs');
const path = require('path');
const projectDir = `${__dirname}/../../`;

function validateEnvironment(env) {
    try {
        fs.statSync(`${projectDir}/config/config-${env}.js`);
    } catch (err) {
        if (err.code === 'ENOENT') {
            throw Object.assign(new Error(`Environment ${env} does not exist`),
                { detail: `You must create its configuration file at config/config-${env}.js.` });
        }

        throw err;
    }

    process.stdout.write(`Environment ${env} is valid.\n`);
}

function validateBuild() {
    try {
        fs.statSync(`${projectDir}/web/build/.manifest.json`);
    } catch (err) {
        if (err.code === 'ENOENT') {
            throw Object.assign(new Error(`No build was found in ${path.relative(process.cwd(), `${projectDir}/web`)}`),
                { detail: 'Please build the project before running this command.' });
        }

        throw err;
    }

    process.stdout.write('Build was found.\n');
}

module.exports = {
    validateEnvironment,
    validateBuild,
};
