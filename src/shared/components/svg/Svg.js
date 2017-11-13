import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './Svg.css';

// See: https://github.com/Karify/external-svg-sprite-loader

class Svg extends PureComponent {
    render() {
        const { svg, className, title, ...props } = this.props;

        return (
            <i className={ classnames(styles.svg, className) }>
                <svg viewBox={ svg.viewBox } { ...props }>
                    { title ? <title>{ title }</title> : null }
                    <use xlinkHref={ svg.symbol } />
                </svg>
            </i>
        );
    }
}

Svg.propTypes = {
    svg: PropTypes.object.isRequired,
    title: PropTypes.string,
    className: PropTypes.string,
};

module.exports = Svg;
