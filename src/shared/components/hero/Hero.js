import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './Hero.css';

const Hero = ({ small }) => <div className={ classNames(styles.hero, { [styles.small]: small }) } />;

Hero.defaultProps = {
    small: false,
};

Hero.propTypes = {
    small: PropTypes.bool,
};

export default Hero;
