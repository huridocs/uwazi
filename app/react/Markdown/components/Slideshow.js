import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/scss/image-gallery.scss';
import PropTypes from 'prop-types';
import React from 'react';

const Slideshow = ({
  children,
  showNav,
  showFullscreenButton,
  showPlayButton,
  autoPlay,
  classname,
}) => {
  const items = children.map(c => ({ renderItem: () => c }));
  return (
    <ImageGallery
      additionalClass={classname}
      items={items}
      autoPlay={autoPlay}
      showNav={showNav}
      showThumbnails={false}
      showFullscreenButton={showFullscreenButton}
      showPlayButton={showPlayButton}
    />
  );
};

Slideshow.defaultProps = {
  autoPlay: true,
  showNav: false,
  showFullscreenButton: false,
  showPlayButton: false,
  classname: '',
};

Slideshow.propTypes = {
  classname: PropTypes.string,
  autoPlay: PropTypes.bool,
  showNav: PropTypes.bool,
  showFullscreenButton: PropTypes.bool,
  showPlayButton: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]).isRequired,
};

export default Slideshow;
