export default (loadComponent) => [
    {
        path: 'about',
        // @ifdef DEV
        // Ensure component is required synchronously in DEV so that it works with react-hot-loader
        // See: https://github.com/gaearon/react-hot-loader/issues/288#issuecomment-281372266
        component: require('./About').default,
        // @endif
        getComponent: () => loadComponent(import('./About')),
    },
];
