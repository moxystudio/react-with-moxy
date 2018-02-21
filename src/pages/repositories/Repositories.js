import React, { PureComponent } from 'react';
import Helmet from 'react-helmet';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { fetchRepositories } from 'shared/state/repositories/actions';
import { getResult, getIsFetching, getError } from 'shared/state/repositories/selectors';
import { provideHooks } from 'redial';
import Hero from '../../shared/components/hero/Hero';
import List from './list/List.js';
import styles from './Repositories.css';

class Repositories extends PureComponent {
    componentDidMount() {
        const { repositories, fetchRepositories } = this.props;

        !repositories.length && fetchRepositories();
    }

    render() {
        const { repositories, isFetching, error } = this.props;

        return (
            <main className={ styles.repositoriesPage }>
                <Helmet title="Repositories" />
                <Hero />
                <div className={ styles.container }>
                    {
                        error &&
                            'Oops.. there was an error fetching the repositories!'
                    }
                    {
                        (!repositories.length && !isFetching && !error) &&
                            'No repositories'
                    }
                    {
                        isFetching ?
                            'Loading Repositories...' :
                            <List repositories={ repositories } />
                    }
                </div>
            </main>
        );
    }

    static propTypes = {
        repositories: PropTypes.array.isRequired,
        isFetching: PropTypes.bool.isRequired,
        error: PropTypes.object,
        fetchRepositories: PropTypes.func.isRequired,
    };
}

const mapStateToProps = (state) => ({
    repositories: getResult(state),
    isFetching: getIsFetching(state),
    error: getError(state),
});

const mapDispatchToProps = {
    fetchRepositories,
};

const hooks = {
    fetch: ({ dispatch }) => dispatch(fetchRepositories()),
};

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    provideHooks(hooks),
)(Repositories);
