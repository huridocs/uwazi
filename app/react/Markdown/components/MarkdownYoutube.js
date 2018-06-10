import PropTypes from 'prop-types';
import React, {Component} from 'react';
import MarkdownMedia from './MarkdownMedia';

export class MarkdownYoutube extends MarkdownMedia {}

MarkdownYoutube.propTypes = {
  config: PropTypes.string
};

export default MarkdownYoutube;
