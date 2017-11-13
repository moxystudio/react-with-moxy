import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import SvgInlineReact from 'svg-inline-react';
import styles from './Svg.css';

class SvgInline extends PureComponent {
    render() {
        const { className, svg, ...props } = this.props;

        return (
            <SvgInlineReact className={ classnames(styles.svg, className) } src={ svg } { ...props } />
        );
    }
}

SvgInline.propTypes = {
    svg: PropTypes.string.isRequired,
    className: PropTypes.string,
};

export default SvgInline;
