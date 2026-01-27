import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ItemFooter } from '#app/Layout/Lists.js';
import { connect } from 'react-redux';
import docState from '#app/Library/docState.js';

export class UploadEntityStatus extends Component {
  renderProgressBar() {
    const isInProgress = this.props.progress || this.props.progress === 0;

    if (isInProgress) {
      return <ItemFooter.ProgressBar progress={this.props.progress} />;
    }
  }

  render() {
    if (!this.props.status) {
      return null;
    }

    const ProgressBar = this.renderProgressBar();

    return (
      <div>
        {ProgressBar}
        <ItemFooter.Label status={this.props.status}>{this.props.message}</ItemFooter.Label>
      </div>
    );
  }
}

UploadEntityStatus.propTypes = {
  progress: PropTypes.number,
  status: PropTypes.string,
  message: PropTypes.string,
};

export function mapStateToProps(state, props) {
  return docState(state, props);
}

export default connect(mapStateToProps)(UploadEntityStatus);
