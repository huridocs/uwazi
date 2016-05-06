import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import UTCToLocal from 'app/Layout/UTCToLocal';

import {setPreviewDoc} from 'app/Library/actions/libraryActions';

export class Doc extends Component {

  preview() {
    this.props.setPreviewDoc(this.props._id);
  }

  render() {
    let {title, _id, previewDoc, creationDate} = this.props;
    let documentViewUrl = '/document/' + _id;
    return (
      <li className="col-sm-4">
        <div className={'item' + (previewDoc === _id ? ' active' : '')} onClick={this.preview.bind(this)}>
          <div className="preview">
            <Link to={documentViewUrl} className="item-name">{title}</Link>
          </div>
          <div className="item-metadata">
            <span className="item-date"><UTCToLocal utc={creationDate}/></span>
            <span className="label label-default"></span>
          </div>
        </div>
      </li>
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
