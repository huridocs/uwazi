import React, { Component } from 'react';
import ReactPlayer from 'react-player';
import { Icon } from 'UI';

const propsToConfig = (props) => {
  const config = {
    url: '',
    options: {}
  };

  let parsedProps = props.config.replace(/\(|\)/g, '').split(',');
  config.url = parsedProps.shift();

  parsedProps = parsedProps.join(',') || '{}';
  parsedProps = parsedProps.replace(/&quot;/g, '"');

  try {
    parsedProps = JSON.parse(parsedProps);
  } catch (error) {
    parsedProps = {};
    console.log(error);
  }

  config.options = parsedProps;

  return config;
};

class MarkdownMedia extends Component {
  timeLinks(_timelinks) {
    const timelinks = _timelinks || {};
    return Object.keys(timelinks).map((timeKey, index) => {
      const seconds = timeKey.split(':').reverse().reduce((_seconds, n, _index) => _seconds + parseInt(n, 10) * (60 ** _index), 0);
      return (
        <div className="timelink" key={index} onClick={this.seekTo.bind(this, seconds)} >
          <b><Icon icon="play" /> {timeKey}</b>
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

    return (
      <div className="video-container">
        <div>
          <ReactPlayer
            ref={(ref) => { this.player = ref; }}
            width="100%"
            height="100%"
            url={config.url}
            controls
          />
        </div>
        <div>
          {this.timeLinks(config.options.timelinks)}
        </div>
      </div>
    );
  }
}

export default MarkdownMedia;
