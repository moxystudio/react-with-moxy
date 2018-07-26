import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import Hero from 'shared/components/hero/Hero';
import styles from './NotFound.css';

class NotFound extends PureComponent {
    static propTypes = {
        serverContext: PropTypes.object,
    };

    constructor(props) {
        super(props);

        // Set status code to 404
        this.props.serverContext && this.props.serverContext.res.status(404);
    }

    render() {
        return (
            <main className={ styles.notFoundPage }>
                <Helmet title="404" />

                <Hero small />
                <div className={ styles.container }>
                    <h1>404</h1>
                    <p>The page you are looking for does not exist.</p>
                </div>
            </main>
        );
    }
}

export default NotFound;
