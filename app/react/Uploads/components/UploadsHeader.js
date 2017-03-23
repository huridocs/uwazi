import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {newEntity} from 'app/Uploads/actions/uploadsActions';
import {t} from 'app/I18N';

export class UploadsHeader extends Component {

  render() {
    return (
      <div className="content-header">
        <div className="content-header-title">
          <h1 className="item-name">{t('System', 'My Files')}</h1>
          <button type="button" className="btn btn-success btn-xs" onClick={this.props.newEntity}>
            <i className="fa fa-plus"/>&nbsp;
            <span>{t('System', 'New entity')}</span>
          </button>
        </div>
      </div>
    );
  }
}

UploadsHeader.propTypes = {
  newEntity: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({newEntity}, dispatch);
}

export default connect(null, mapDispatchToProps)(UploadsHeader);
