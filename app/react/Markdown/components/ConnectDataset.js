import React from 'react';
import PropTypes from 'prop-types';
import Connect from './Connect';

const ConnectDataset = (props) => {
  const { name } = props;
  const path = `page.datasets.${name}`;
  return (<Connect data={path}/>);
};

ConnectDataset.defaultProps = {
  name: 'default'
};

ConnectDataset.propTypes = {
  name: PropTypes.string,
};
