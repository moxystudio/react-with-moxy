<img width="110" src="https://user-images.githubusercontent.com/9271177/36511315-150065a8-175e-11e8-8f7a-27d3f72aa52b.png" />

# react-with-moxy

[![Build Status][travis-image]][travis-url] [![Dependency status][david-dm-image]][david-dm-url] [![Dev Dependency status][david-dm-dev-image]][david-dm-dev-url] [![Greenkeeper badge][greenkeeper-image]][greenkeeper-url]


[travis-url]:https://travis-ci.org/moxystudio/react-with-moxy
[travis-image]:http://img.shields.io/travis/moxystudio/react-with-moxy/master.svg
[david-dm-url]:https://david-dm.org/moxystudio/react-with-moxy
[david-dm-image]:https://img.shields.io/david/moxystudio/react-with-moxy.svg
[david-dm-dev-url]:https://david-dm.org/moxystudio/react-with-moxy?type=dev
[david-dm-dev-image]:https://img.shields.io/david/dev/moxystudio/react-with-moxy.svg
[greenkeeper-image]:https://badges.greenkeeper.io/moxystudio/react-with-moxy.svg
[greenkeeper-url]:https://greenkeeper.io

Opinionated boilerplate to create isomorphic react applications.


## Motivation

Isomorphic JavaScript applications can be pretty challenging and hard to setup.

`react-with-moxy` offers you the required tooling for your universal JavaScript application, as well as an opinionated frontend stack ready to kick-off your next project.

In the near future, we will be moving all the built-in tooling under `scripts/` to a separate package. This will make it easier for projects based on this boilerplate to receive updates.


## What's Included?

- [React](https://reactjs.org/)
- [React Router](https://github.com/ReactTraining/react-router)
    - we use v3 because v4 have some conceptual [problems](https://github.com/ReactTraining/react-router/issues/5076#issuecomment-326456921) that we are trying to avoid
- [Babel](https://babeljs.io) with [babel-preset-moxy](https://github.com/moxystudio/babel-preset-moxy)
- [PostCSS](http://postcss.org/) with [postcss-preset-moxy](https://github.com/moxystudio/postcss-preset-moxy)
- [Webpack](https://webpack.js.org/)
- [ESLint](https://eslint.org/) with [eslint-config-moxy](https://github.com/moxystudio/eslint-config-moxy)
- [Stylelint](https://stylelint.io/) with [stylelint-config-moxy](https://github.com/moxystudio/stylelint-config-moxy)
- [Express](https://expressjs.com/)
- [Node](https://nodejs.org)
- [Jest](https://facebook.github.io/jest/) and [Enzyme](https://github.com/airbnb/enzyme)
- Dockerfile


## Table of Contents

- [Installation and setup](#installation-and-setup)
- [Commands](#commands)
    - [build](#build)
    - [start](#start)
    - [start-dev](#start-dev)
    - [test](#test)
    - [lint](#lint)
    - [release](#release)
- [Environment variables](#environment-variables)
- [Customization](#customization)
    - [Customizing the server](#customizing-the-server)
    - [Customizing Webpack](#customizing-webpack)
    - [Customizing Jest](#customizing-jest)
- [Examples](#examples)
- [FAQ](#faq)
- [Used in](#used-in)


## Installation and setup

```sh
$ npm install
```


## Commands

### build

```sh
$ npm run build
```

Builds the project for production, producing the bundled assets at `public/build`.
Please run `npm run build -- -h` for more options.

### start

```sh
$ npm start
```

Starts a production server. You must run `npm run build` before running this command.   
Please run `npm start -- -h` for more options.

### start-dev

```sh
$ npm run start-dev
```

Starts a development server, opening a browser window automatically.   
Please run `npm run start-dev -- -h` for more options.

### test

```sh
$ npm test
```

Runs the project tests using [**Jest**](https://facebook.github.io/jest/). You may pass whatever options the [**Jest CLI**](https://facebook.github.io/jest/docs/en/cli.html#content).

### lint

```sh
$ npm run lint
```

Runs **ESlint** and **Stylelint** on the project.
Please run `npm run lint -- -h` for more options.

### release

```sh
$ npm run release
```

We use conventional commit messages. When running this command it will run [**standard-version**](https://github.com/conventional-changelog/standard-version) that does the following:

1. Bump the version in package.json (based on your commit history)
2. Uses conventional-changelog to update CHANGELOG.md
3. Commits package.json and CHANGELOG.md
4. Tags a new release

And after the tagging step, it will run `git push --follow-tags origin master`, as defined [here](package.json#L35).


## Environment variables

Your project can consume variables declared in your environment by accessing them via `process.env`.

The following variables will be made available:

- `NODE_ENV`: One of `development`, `production` or `test`.
- `SITE_URL`: Where the web app is accessible (e.g.: http://some-project.com).
- `PUBLIC_URL`: Where the web app `public/` folder is being served from. This is usually the same as the `SITE_URL` unless you use an external CDN to store and serve the files. You may use this to generate URLs to assets that do not go through Webpack.
- `REACT_APP_*`: Custom variables that may be accessible in both the client and server bundles.

These will be embeded at **build time**, thus are **read-only**. This means you must rebuild your application every time you change them.

### Server bundle

Besides the variables listed above, your server bundle will have access to the whole `process.env` just like a regular Node.js application.

### Client bundle

Only the variables listed above will be available.

If you need custom environment variables, you must prefix them with `REACT_APP_`. This avoids accidentally exposing sensitive environment variables, such as a private key or a database credential.

### .env file

Environment variables defined on `.env` file will be loaded into `process.env`.
Please read [**dotenv**](https://github.com/motdotla/dotenv) documentation for more information.

```
REACT_APP_FOO=foo
REACT_APP_BAR=bar
```

This file is ignored in source control and it is intended to be created from `.env.sample`, which is commited and anyone who clones the project can easily use it as a starting point.

### Passing environment variables when building a docker image

The project includes a `Dockerfile`, allowing you to generate a docker image of your project. Here's an example of how to build the docker image and pass a few environment variables:

```sh
$ docker build .
  --tag my-project:latest \
  --build-arg $SITE_URL=http://my-site.com \
  --build-arg $PUBLIC_URL=http://cdn.my-site.com
```

The environment variables are mapped to [build args](https://docs.docker.com/engine/reference/builder/#arg) in the `Dockerfile`. This means that you **must update** the `Dockerfile` anytime you add new environment variables.


## Customization

### Customizing the server

You may tweak the express server on `start` and `start-dev` scripts:

```sh
└── scripts
    ├── start (production server)
    └── start-dev (development server)
```

### Customizing Webpack

You may tweak the **Webpack** configuration, such as adding new loaders or editing [Babel](https://babeljs.io/) plugins on `config-client.js` and `config-server.js`:

```sh
└── scripts
    └── config
        └── webpack
            ├── config-client.js
            └── config-server.js
```

### Customizing Jest

You may tweak the **Jest** configuration on `jest` folder:

```sh
└── scripts
    └── config
        └── jest
            ├── index.js
            ├── setup.js
            └── transformer.js
```

### Customizing the manifest file

The `build-manifest.json` file contains a summary of the build, including the produced assets, to be used when rendering the document on the server. You can customize its content on `manifest.js`:

```sh
└── scripts
    └── util
        └── manifest.js
```


## Examples

<details>
    <summary><b>Integration with:</b></summary>
    <ul>
        <li><a href="https://github.com/moxystudio/react-with-moxy/tree/examples/with-redux">Redux</a></li>
    </ul>
</details>


## FAQ

**How can I import an SVG as inline instead of adding it to the sprite?**

Sometimes, you may want to import an SVG as inline either because you want to animate SVG paths or if you're just having issues with the sprite. If that is the case, you may change the file suffix from `.svg` to `.inline.svg` to import the SVG contents directly:

```js
import someSvg from './some.inline.svg';

// `someSvg` is something like <svg ... />
```

**Should Node.js be responsible for compressing assets with gzip?**

Doing the compression in **Node.js** might hold the event loop which is not desirable for performance reasons. That's why we employ `gzip` and `br` compression at build time. We use [compression-webpack-plugin](https://github.com/webpack-contrib/compression-webpack-plugin) to compress the assets when the project is built and the production server will attempt to serve the compressed files based on the requests' [Accept-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding) header.

Nevertheless, if you want to do compression in an upstream server, like **nginx**, you may disable serving the compressed files by starting the server with:

```sh
npm start -- --no-gzip
```

## Used in

- [Hellywood](https://hellywood.com/)
- [Platforme](https://platforme.com/)
