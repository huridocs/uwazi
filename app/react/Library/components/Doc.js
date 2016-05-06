import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import UTCToLocal from 'app/Layout/UTCToLocal';

import {setPreviewDoc} from 'app/Library/actions/libraryActions';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';

export class Doc extends Component {

  preview() {
    this.props.setPreviewDoc(this.props._id);
  }

  render() {
    let {title, _id, creationDate} = this.props;
    let documentViewUrl = '/document/' + _id;
    return (
      <RowList.Item>
        <ItemName><Link to={documentViewUrl} className="item-name">{title}</Link></ItemName>
        <ItemFooter>
          <ItemFooter.Label>Decision</ItemFooter.Label>
          <ItemFooter.Label><UTCToLocal utc={creationDate}/></ItemFooter.Label>
          <Link to={documentViewUrl} className="item-shortcut"><i className="fa fa-file-o"></i></Link>
        </ItemFooter>
      </RowList.Item>
    );
  }
}

Doc.propTypes = {
  _id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  previewDoc: PropTypes.string,
  setPreviewDoc: PropTypes.func.isRequired,
  creationDate: PropTypes.number
};


export function mapStateToProps(state) {
  return {
    previewDoc: state.library.ui.toJS().previewDoc
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setPreviewDoc}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Doc);
