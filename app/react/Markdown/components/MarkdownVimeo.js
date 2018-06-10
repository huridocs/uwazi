import PropTypes from 'prop-types';
import React, { Component } from 'react';
import MarkdownMedia from './MarkdownMedia';

export class MarkdownVimeo extends MarkdownMedia {}

MarkdownVimeo.propTypes = {
  config: PropTypes.string
};

export default MarkdownVimeo;
