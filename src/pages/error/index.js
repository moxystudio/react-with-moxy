/* eslint-disable prefer-import/prefer-import-over-require */

export default (loadComponent) => [
    {
        path: '/internal-error',
        // @ifdef SYNC_ROUTES
        // Ensure component is required synchronously so that it works with react-hot-loader
        // See: https://github.com/gaearon/react-hot-loader/issues/288#issuecomment-281372266
        component: require('./internal-error/InternalError').default,
        // @endif
        getComponent: () => loadComponent(import(/* webpackChunkName: "error" */ './internal-error/InternalError')),
    },
    {
        path: '/*',
        // @ifdef SYNC_ROUTES
        // Ensure component is required synchronously so that it works with react-hot-loader
        // See: https://github.com/gaearon/react-hot-loader/issues/288#issuecomment-281372266
        component: require('./not-found/NotFound').default,
        // @endif
        getComponent: () => loadComponent(import(/* webpackChunkName: "error" */ './not-found/NotFound')),
    },
];
