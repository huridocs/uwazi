import PropTypes from 'prop-types';
import React, { Component } from 'react';

const getExtension = filename => filename.substr(filename.lastIndexOf('.') + 1);

const acceptedThumbnailExtensions = ['png', 'gif', 'jpg'];

export class Thumbnail extends Component {
  render() {
    const extension = getExtension(this.props.file);
    let thumbnail;

    if (acceptedThumbnailExtensions.includes(extension)) {
      thumbnail = <img src={this.props.file} alt={this.props.alt} />;
    }

    if (extension === 'pdf') {
      thumbnail = <span><i className="far fa-file-pdf" /> pdf</span>;
    }

    return <div className="thumbnail">{thumbnail}</div>;
  }
}

Thumbnail.defaultProps = {
  alt: ''
};

Thumbnail.propTypes = {
  file: PropTypes.string.isRequired,
  alt: PropTypes.string
};

export default Thumbnail;
