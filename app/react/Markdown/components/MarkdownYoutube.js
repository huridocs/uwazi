import PropTypes from 'prop-types';
import React, {Component} from 'react';

export class MarkdownYoutube extends Component {

  render() {
    const videoUrl = this.props.config.replace(/\(|\)/g, '');
    const videoId = videoUrl.split('/').reverse()[0];
    const src = `https://www.youtube.com/embed/${videoId}?rel=0&amp;showinfo=0`;
    return (
      <div className="video-container">
        <iframe src={src} frameBorder="0" allowFullScreen />
      </div>
    );
  }
}

MarkdownYoutube.propTypes = {
  config: PropTypes.string
};

export default MarkdownYoutube;
