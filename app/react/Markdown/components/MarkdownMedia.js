import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactPlayer from 'react-player';

export class MarkdownMedia extends Component {
  propsToConfig(props) {
    const config = {
      url: '',
      options: {}
    };

    let parsedProps = props.config.replace(/\(|\)/g, '').split(',');
    config.url = parsedProps.shift();

    parsedProps =  parsedProps.join(',') || '{}';
    parsedProps = parsedProps.replace(/&quot;/g, '"');

    try {
      parsedProps = JSON.parse(parsedProps);
    } catch (error) {
      parsedProps = {};
      console.log(error);
    }

    config.options = parsedProps;

    return config;
  }

  timeLinks(timelinks) {
    timelinks = timelinks || {};
    return Object.keys(timelinks).map((timeKey, index) => {
      const seconds = timeKey.split(':').reverse().reduce((_seconds, n, _index) => _seconds + parseInt(n, 10) * (60 ** _index), 0);
      return (<div className="timelink" key={index} onClick={this.seekTo.bind(this, seconds)} >
        <b><i className="fa fa-play" /> {timeKey}</b>
        <span>{timelinks[timeKey]}</span>
      </div>);
    });
  }

  seekTo(seconds) {
    this.refs.player.seekTo(seconds);
  }

  render() {
    const config = this.propsToConfig(this.props);

    return (
      <div className="video-container">
        <div>
          <ReactPlayer
            ref="player"
            width="100%"
            height="100%"
            url={config.url}
            controls={true}
          />
        </div>
        <div>
          {this.timeLinks(config.options.timelinks)}
        </div>
      </div>
    );
  }
}

MarkdownMedia.propTypes = {
  config: PropTypes.string
};

export default MarkdownMedia;
