import reducer from './reducer';
import * as actionTypes from './actionTypes';
import * as actions from './actions';
import * as selectors from './selectors';

// Reducer is the default export
export default reducer;

// Actions, Action Types, Selectors, Reducer and Middlewares as named exports
export {
    reducer,
    actionTypes,
    actions,
    selectors,
};
