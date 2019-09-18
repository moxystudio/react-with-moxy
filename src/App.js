import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import Header from './header/Header';
import Footer from './footer/Footer';
import styles from './App.css';
import buildPageRoutes from './pages/buildRoutes';

class App extends PureComponent {
        static propTypes = {
            children: PropTypes.element,
        };

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

export function buildRoutes() {
    return {
        component: App,
        ...buildPageRoutes(),
    };
}

export default App;
