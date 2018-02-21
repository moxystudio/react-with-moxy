const getRepositories = (state) => state.repositories;

export const getIsFetching = (state) => getRepositories(state).isFetching;
export const getResult = (state) => getRepositories(state).result;
export const getError = (state) => getRepositories(state).error;
