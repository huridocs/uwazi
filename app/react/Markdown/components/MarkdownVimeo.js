import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Player from '@vimeo/player';

export class MarkdownVimeo extends Component {
  propsToConfig(props) {
    let options = props.config.replace(/\(|\)/g, '').split(',');
    const videoUrl = options.shift();
    const videoId = videoUrl.split('/').reverse()[0];
    options = options.join(',') || '{}';
    options = options.replace(/&quot;/g, '"');
    try {
      options = JSON.parse(options);
    } catch (error) {
      options = {};
    }
    return { videoId, options };
  }

  componentDidMount() {
    this.player = new Player(this.iframe);
  }

  setTime(time) {
    this.player.setCurrentTime(time);
  }

  timeLinks(config) {
    config.options.timelinks = config.options.timelinks || {};
    return Object.keys(config.options.timelinks).map((timeKey, index) => {
      const seconds = timeKey.split(':').reverse().reduce((_seconds, n, _index) => _seconds + parseInt(n, 10) * (60 ** _index), 0);
      return (<div className="timelink" key={index} onClick={this.setTime.bind(this, seconds)} >
        <b><i className="fa fa-play" /> {timeKey}</b>
        <span>{config.options.timelinks[timeKey]}</span>
      </div>);
    });
  }

  render() {
    const config = this.propsToConfig(this.props);
    const title = config.options.title ? '1' : '0';
    const byline = config.options.byline ? '1' : '0';
    const portrait = config.options.portrait ? '1' : '0';
    const src = `https://player.vimeo.com/video/${config.videoId}?title=${title}&byline=${byline}&portrait=${portrait}`;

    return (
      <div className="video-container">
        <div>
          <iframe
            ref={iframe => this.iframe = iframe}
            src={src}
            frameBorder="0"
            allowFullScreen
          />
        </div>
        <div>
          {this.timeLinks(config)}
        </div>
      </div>
    );
  }
}

MarkdownVimeo.propTypes = {
  config: PropTypes.string
};

export default MarkdownVimeo;
