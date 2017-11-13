import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import styles from './NotFound.css';

class NotFound extends PureComponent {
    componentWillMount() {
        // Set status code to 404
        this.props.serverContext && this.props.serverContext.res.status(404);
    }

    render() {
        return (
            <main className={ styles.notFoundPage }>
                <Helmet title="404" />

                <div className={ styles.hero } />
                <div className={ styles.container }>
                    <h1>404</h1>
                    <p>The page you are looking for does not exist.</p>
                </div>
            </main>
        );
    }
}

NotFound.propTypes = {
    serverContext: PropTypes.object,
};

export default NotFound;
