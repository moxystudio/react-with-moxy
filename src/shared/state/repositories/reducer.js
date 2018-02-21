import * as actionTypes from './actionTypes';
import { combineReducers } from 'redux';

const initialState = {
    isFetching: false,
    result: [],
    error: null,
};

const isFetching = (state = initialState.isFetching, action = {}) => {
    switch (action.type) {
    case actionTypes.FETCH_START:
        return true;
    case actionTypes.FETCH_SUCCESS:
    case actionTypes.FETCH_FAIL:
        return false;
    default:
        return state;
    }
};

const result = (state = initialState.result, action = {}) => {
    switch (action.type) {
    case actionTypes.FETCH_SUCCESS:
        return action.payload;
    default:
        return state;
    }
};

const error = (state = initialState.error, action = {}) => {
    switch (action.type) {
    case actionTypes.FETCH_FAIL:
        return action.payload;
    case actionTypes.FETCH_START:
    case actionTypes.FETCH_SUCCESS:
        return null;
    default:
        return state;
    }
};

export default combineReducers({
    isFetching,
    result,
    error,
});
