import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';

export class UploadDoc extends Component {
  render() {
    let doc = this.props.doc.toJS();

    let status = 'success';
    let message = 'Ready for publish';

    if (doc.uploaded === false) {
      status = 'danger';
      message = 'Upload failed';
    }

    let itsUploading = typeof this.props.progress === 'number';

    if (itsUploading) {
      status = 'info';
    }

    return (
      <RowList.Item status={status}>
        <ItemName>{doc.title}</ItemName>
        <ItemFooter>
          {(() => {
            if (itsUploading) {
              return <ItemFooter.ProgressBar progress={this.props.progress} />;
            }
            return <ItemFooter.Label status={status}>{message}</ItemFooter.Label>;
          })()}
        </ItemFooter>
      </RowList.Item>
    );
  }
}

UploadDoc.propTypes = {
  doc: PropTypes.object,
  progress: PropTypes.number
};

export function mapStateToProps(state, props) {
  return {
    progress: state.uploads.progress.get(props.doc.get('_id'))
  };
}

export default connect(mapStateToProps)(UploadDoc);
