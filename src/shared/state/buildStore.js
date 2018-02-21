import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import repositoriesReducer from './repositories';

export default function buildStore(history, initialState) {
    const reducer = combineReducers({
        repositories: repositoriesReducer,
    });
    const middlewares = [
        thunk,
    ];
    const enhancers = [
        applyMiddleware(...middlewares),
    ];
    // If Redux DevTools Extension is installed use it, otherwise use Redux compose
    const composeEnhancers = process.env.NODE_ENV !== 'production' && typeof window === 'object' &&
        window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;
    const store = createStore(reducer, initialState, composeEnhancers(...enhancers));

    return store;
}
