import React from 'react';
import PropTypes from 'prop-types';
import styles from './Repository.css';

const Repository = ({ repository }) => {
    const { html_url: htmlURL, description } = repository;

    return (
        <li className={ styles.repository }>
            <a href={ htmlURL } target="_blank">{ repository.name }</a>
            <p>{ description }</p>
        </li>
    );
};

Repository.propTypes = {
    repository: PropTypes.object.isRequired,
};

export default Repository;
