import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';

import {setPreviewDoc} from 'app/Library/actions/libraryActions';

export class Doc extends Component {

  preview() {
    this.props.setPreviewDoc(this.props._id);
  }

  render() {
    let {title, _id, previewDoc} = this.props;
    let documentViewUrl = '/document/' + _id;
    return (
      <li className="col-sm-4">
        <div className={'item' + (previewDoc === _id ? ' active' : '')} onClick={this.preview.bind(this)}>
          <div className="preview">
            <Link to={documentViewUrl} className="item-name">{title}</Link>
          </div>
          <div className="item-metadata">
            <span className="item-date">March 14</span>
            <span className="label label-default">Decision</span>
          </div>
          <div className="item-snippets"><span> <i className="fa fa-search"></i> 3 matches</span>
            <p>
              "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Beatae <b>africa</b>
              aut velit autem pariatur commodi. Voluptates perspiciatis nihil <b>africa</b>
              consequuntur fugit eum recusandae dolor, aliquid tempora sint aliquam <b>africa</b>."
            </p>
          </div>
          {/*
          <div className="item-preview">
            <div className="row">
              <div className="col-sm-4">
                <h4>Metadata 1</h4>
                <p>Text</p>
                <p>Text</p>
                <p>Text</p>
                <p>Text</p>
                <p>Text</p>
              </div>
              <div className="col-sm-4">
                <h4>Metadata 2</h4>
                <p>Text</p>
                <p>Text</p>
                <p>Text</p>
                <p>Text</p>
                <p>Text</p>
              </div>
              <div className="col-sm-4">
                <h4>Metadata 3</h4>
                <p>Text</p>
                <p>Text</p>
                <p>Text</p>
                <p>Text</p>
                <p>Text</p>
              </div>
              <div className="col-sm-6">
                <div className="btn btn-default btn-close"><i className="fa fa-close"></i>Close preview</div>
              </div>
              <div className="col-sm-6">
                <div className="btn btn-success btn-open">View document<i className="fa fa-arrow-right"></i></div>
              </div>
            </div>
          </div>
          */}
        </div>
      </li>
    );
  }
}

Doc.propTypes = {
  _id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  previewDoc: PropTypes.string,
  setPreviewDoc: PropTypes.func.isRequired
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
