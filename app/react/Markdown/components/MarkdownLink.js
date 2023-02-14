import { Link } from 'react-router-dom';
import { isClient } from 'app/utils';
import PropTypes from 'prop-types';
import React from 'react';

const MarkdownLink = ({ url, classname, children }) => {
  if (isClient) {
    console.warn('MarkdownLink is deprecated, use <Link to="url"></Link> instead');
  }
  return (
    <Link to={url} className={classname}>
      {children}
    </Link>
  );
};

MarkdownLink.defaultProps = {
  children: '',
  classname: '',
};

MarkdownLink.propTypes = {
  url: PropTypes.string.isRequired,
  classname: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]),
};

export default MarkdownLink;
