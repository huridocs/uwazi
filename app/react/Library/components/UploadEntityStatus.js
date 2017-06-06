  import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {ItemFooter} from 'app/Layout/Lists';
import {connect} from 'react-redux';
import ShowIf from 'app/App/ShowIf';

export class UploadEntityStatus extends Component {

  render() {
    if (!this.props.status) {
      return null;
    }
    return <div>
              <ShowIf if={!!this.props.progress}>
                <ItemFooter.ProgressBar progress={this.props.progress} />
              </ShowIf>
              <ItemFooter.Label status={this.props.status}>
              {this.props.message}
             </ItemFooter.Label>
           </div>;
  }
}

UploadEntityStatus.propTypes = {
  progress: PropTypes.number,
  status: PropTypes.string,
  message: PropTypes.string
};

export function mapStateToProps(state, props) {
  const progress = state.progress.get(props.doc.get('sharedId'));
  const uploaded = props.doc.get('uploaded');
  const processed = props.doc.get('processed');
  const isEntity = props.doc.get('type') === 'entity';
  if (!uploaded && !isEntity && progress) {
    return {
      progress,
      status: 'processing',
      message: 'Uploading...'
    };
  }

  if (typeof props.doc.get('processed') === 'undefined' && !isEntity && uploaded) {
    return {
      progress: 100,
      status: 'processing',
      message: 'Processing...'
    };
  }

  if (!props.doc.get('template') && (processed || isEntity)) {
    return {
      progress,
      status: 'warning',
      message: 'No type selected'
    };
  }

  if (!uploaded && !isEntity && !progress) {
    return {
      progress,
      status: 'danger',
      message: 'Upload failed'
    };
  }

  if (processed === false && !isEntity) {
    return {
      status: 'danger',
      message: 'Conversion failed'
    };
  }

  return {};
}

export default connect(mapStateToProps)(UploadEntityStatus);
