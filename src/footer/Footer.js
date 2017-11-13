import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './Footer.css';

class Footer extends PureComponent {
    render() {
        const { className } = this.props;
        const footerClass = classNames(`${styles.footer}`, `${className}`);

        return (
            <footer className={ footerClass }>
                <a
                    className={ styles.madeWithMoxyLink }
                    href="https://moxy.studio"
                    target="_blank">#madewithmoxy
                </a>
            </footer>
        );
    }
}

Footer.propTypes = {
    className: PropTypes.string,
};

export default Footer;
