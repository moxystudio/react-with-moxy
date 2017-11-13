export default (loadComponent) => [
    {
        path: 'internal-error',
        // @ifdef DEV
        // Ensure component is required synchronously in DEV so that it works with react-hot-loader
        // See: https://github.com/gaearon/react-hot-loader/issues/288#issuecomment-281372266
        component: require('./internal-error/InternalError').default,
        // @endif
        getComponent: () => loadComponent(import('./internal-error/InternalError')),
    },
    {
        path: '*',
        // @ifdef DEV
        // Ensure component is required synchronously in DEV so that it works with react-hot-loader
        // See: https://github.com/gaearon/react-hot-loader/issues/288#issuecomment-281372266
        component: require('./not-found/NotFound').default,
        // @endif
        getComponent: () => loadComponent(import('./not-found/NotFound')),
    },
];
