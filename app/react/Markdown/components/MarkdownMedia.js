import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player';
import { Icon } from 'UI';

const propsToConfig = props => {
  const config = { url: '', options: {} };

  let parsedProps = props.config.replace(/\(|\)/g, '').split(',');
  config.url = parsedProps.shift();

  parsedProps = (parsedProps.join(',') || '{}').replace(/&quot;/g, '"');

  try {
    parsedProps = JSON.parse(parsedProps);
  } catch (error) {
    parsedProps = {};
  }

  config.options = parsedProps;

  return config;
};

class MarkdownMedia extends Component {
  timeLinks(_timelinks) {
    const timelinks = _timelinks || {};
    return Object.keys(timelinks).map((timeKey, index) => {
      const seconds = timeKey
        .split(':')
        .reverse()
        .reduce((_seconds, n, _index) => _seconds + parseInt(n, 10) * 60 ** _index, 0);
      return (
        <div className="timelink" key={index} onClick={this.seekTo.bind(this, seconds)}>
          <b>
            <Icon icon="play" /> {timeKey}
          </b>
          <span>{timelinks[timeKey]}</span>
        </div>
      );
    });
  }

  seekTo(seconds) {
    this.player.seekTo(seconds);
  }

  render() {
    const config = propsToConfig(this.props);
    const { compact } = this.props;
    const dimensions = { width: '100%' };
    if (compact) {
      dimensions.height = '100%';
    }
    return (
      <div className={`video-container ${compact ? 'compact' : ''}`}>
        <div>
          <ReactPlayer
            className="react-player"
            ref={ref => {
              this.player = ref;
            }}
            url={config.url}
            {...dimensions}
            controls
          />
        </div>
        <div>{this.timeLinks(config.options.timelinks)}</div>
      </div>
    );
  }
}

MarkdownMedia.defaultProps = {
  compact: false,
};

MarkdownMedia.propTypes = {
  compact: PropTypes.bool,
};

export default MarkdownMedia;
