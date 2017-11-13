import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import classNames from 'classnames';
import SvgInline from 'shared/components/svg/SvgInline';
import Navigation from './navigation/Navigation';
import moxySvg from 'shared/media/images/logos/moxy-square.inline.svg';
import styles from './Header.css';

class Header extends PureComponent {
    render() {
        const { className } = this.props;
        const headerClass = classNames(`${styles.header}`, `${className}`);

        return (
            <header className={ headerClass }>
                <Link to="/">
                    <SvgInline className={ styles.logo } svg={ moxySvg } />
                </Link>
                <Navigation />
            </header>
        );
    }
}

Header.propTypes = {
    className: PropTypes.string,
};

export default Header;
