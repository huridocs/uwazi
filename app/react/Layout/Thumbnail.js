import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';

const getExtension = filename => filename.substr(filename.lastIndexOf('.') + 1);

const acceptedThumbnailExtensions = ['png', 'gif', 'jpg'];

export class Thumbnail extends Component {
  render() {
    const { file, alt } = this.props;

    const extension = getExtension(file);
    let thumbnail;

    if (acceptedThumbnailExtensions.includes(extension)) {
      thumbnail = <img src={file} alt={alt} />;
    }

    if (extension === 'pdf') {
      thumbnail = (
        <span no-translate>
          <Icon icon="file-pdf" /> pdf
        </span>
      );
    }

    return <div className="thumbnail">{thumbnail}</div>;
  }
}

Thumbnail.defaultProps = {
  alt: '',
};

Thumbnail.propTypes = {
  file: PropTypes.string.isRequired,
  alt: PropTypes.string,
};

export default Thumbnail;
