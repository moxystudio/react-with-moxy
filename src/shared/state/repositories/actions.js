import axios from 'axios';
import * as actionTypes from './actionTypes';

export const fetchRepositories = () => async (dispatch) => {
    dispatch({ type: actionTypes.FETCH_START });

    try {
        const response = await axios.get('https://api.github.com/orgs/moxystudio/repos', { type: 'public' });

        dispatch({ type: actionTypes.FETCH_SUCCESS, payload: response.data });
    } catch (e) {
        dispatch({ type: actionTypes.FETCH_FAIL, payload: e });

        throw e;
    }
};
