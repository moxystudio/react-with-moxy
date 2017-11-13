import nprogress from 'nprogress';
import homeRoutes from './home';
import aboutRoutes from './about';
import errorRoutes from './error';

async function loadComponent(promise) {
    let Component;

    // Start growing the loading bar
    __CLIENT__ && nprogress.start();

    try {
        Component = await promise;
    } finally {
        // We are done loading!
        __CLIENT__ && nprogress.done();
    }

    return Component.default;
}

// -----------------------------------------------------

export default function buildRoutes() {
    return [
        ...homeRoutes(loadComponent),
        ...aboutRoutes(loadComponent),
        ...errorRoutes(loadComponent),
    ];
}
