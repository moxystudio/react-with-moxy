import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './Svg.css';

const SvgInline = (props) => {
    const { svg, className, ...otherProps } = props;

    return (
        <i
            className={ classnames(styles.svg, className) }
            { ...otherProps }
            dangerouslySetInnerHTML={ { __html: svg } } />
    );
};

SvgInline.propTypes = {
    svg: PropTypes.string.isRequired,
    className: PropTypes.string,
};

export default SvgInline;
