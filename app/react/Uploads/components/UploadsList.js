import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import 'app/Uploads/scss/uploads_list.scss';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';

export class UploadsList extends Component {

  render() {
    const {documents} = this.props;
    return (
      <RowList>
        {documents.map((doc, index) => {
          return (
            <RowList.Item key={index}>
              <ItemName>{doc.title}</ItemName>
              <ItemFooter>
                <ItemFooter.Label>
                  Ready for publish
                </ItemFooter.Label>
              </ItemFooter>
            </RowList.Item>
            );
        })}
      </RowList>
    );
  }
}

UploadsList.propTypes = {
  documents: PropTypes.array.isRequired
};

export function mapStateToProps(state) {
  return {
    documents: state.uploads.documents.toJS()
    //progress: state.uploads.progress.toJS()
  };
}

export default connect(mapStateToProps)(UploadsList);
