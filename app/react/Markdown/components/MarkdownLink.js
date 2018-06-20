import { Link } from 'react-router';
import PropTypes from 'prop-types';
import React from 'react';

const MarkdownLink = ({ url, className, children }) => (
  <Link to={url} className={className} href={url}>{children}</Link>
);

MarkdownLink.defaultProps = {
  children: '',
  className: '',
};

MarkdownLink.propTypes = {
  url: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]),
};

export default MarkdownLink;
