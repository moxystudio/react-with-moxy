import React from 'react';
import Repository from '../repository/Repository';
import PropTypes from 'prop-types';
import styles from './List.css';

const List = ({ repositories }) => (
    <ul className={ styles.list }>
        {
            repositories.map((repository) => (
                <Repository
                    key={ repository.id }
                    repository={ repository } />
            ))
        }
    </ul>
);

List.propTypes = {
    repositories: PropTypes.array.isRequired,
};

export default List;
