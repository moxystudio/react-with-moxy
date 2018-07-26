import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import Hero from 'shared/components/hero/Hero';
import styles from './InternalError.css';

class InternalError extends PureComponent {
    static propTypes = {
        err: PropTypes.object,
        serverContext: PropTypes.object,
    };

    constructor(props) {
        super(props);

        // Set status code to 500
        this.props.serverContext && this.props.serverContext.res.status(500);

        // Log the error (console will be dropped in prod)
        this.props.err && console.error('[InternalError]', this.props.err);
    }

    componentDidUpdate(previousProps) {
        // Log the error if it changes (console will be dropped in prod)
        this.props.err && this.props.err !== previousProps && console.log('[InternalError]', this.props.err);
    }

    render() {
        return (
            <main className={ styles.internalErrorPage }>
                <Helmet title="Oops" />

                <Hero small />
                <div className={ styles.container }>
                    <h1>Oops</h1>
                    <p>Something went really wrong and we were unable to fulfill your request.</p>
                </div>
            </main>
        );
    }
}

export default InternalError;
