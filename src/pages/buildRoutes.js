import nprogress from 'nprogress';
import homeRoute from './home';
import aboutRoutes from './about';
import errorRoutes from './error';

async function loadComponent(promise) {
    let Component;

    // Start growing the loading bar
    typeof window !== 'undefined' && nprogress.start();

    try {
        Component = await promise;
    } finally {
        // We are done loading!
        typeof window !== 'undefined' && nprogress.done();
    }

    return Component.default;
}

// -----------------------------------------------------

export default function buildRoutes() {
    return {
        path: '/',
        indexRoute: homeRoute(),
        childRoutes: [
            ...aboutRoutes(loadComponent),
            ...errorRoutes(loadComponent),
        ],
    };
}
