import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import Header from './header/Header';
import Footer from './footer/Footer';
import styles from './App.css';
import { default as buildPageRoutes } from './pages/buildRoutes';

class App extends PureComponent {
    render() {
        const { children } = this.props;

        return (
            <div className={ styles.app }>
                <Helmet
                    htmlAttributes={ { lang: 'en' } }
                    defaultTitle="MOXY"
                    titleTemplate="MOXY - %s"
                    meta={ [
                        { name: 'description', content: 'MOXY\'s awesome react-with-moxy boilerplate' },
                    ] } />

                <Header className={ styles.header } />
                { children }
                <Footer className={ styles.footer } />
            </div>
        );
    }
}

App.propTypes = {
    children: PropTypes.element,
};

export function buildRoutes() {
    return {
        path: '/',
        component: App,
        childRoutes: buildPageRoutes(),
    };
}

export default App;
