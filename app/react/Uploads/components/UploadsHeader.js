import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {newEntity} from 'app/Uploads/actions/uploadsActions';
import {t} from 'app/I18N';
import {wrapDispatch} from 'app/Multireducer';
import ShowIf from 'app/App/ShowIf';

export class UploadsHeader extends Component {

  render() {
    return (
      <div className="content-header">
        <div className="content-header-title">
          <h1 className="item-name">{t('System', 'My Files')}</h1>
          <ShowIf if={this.props.entityTemplatesExists}>
            <button type="button" className="btn btn-success btn-xs" onClick={this.props.newEntity}>
              <i className="fa fa-plus"/>&nbsp;
              <span>{t('System', 'New entity')}</span>
            </button>
          </ShowIf>
        </div>
      </div>
    );
  }
}

UploadsHeader.propTypes = {
  newEntity: PropTypes.func,
  entityTemplatesExists: PropTypes.bool
};

export function mapStateToProps(state) {
  return {
    entityTemplatesExists: state.templates.reduce((result, template) => result || template.get('isEntity'), false)
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({newEntity}, wrapDispatch(dispatch, 'uploads'));
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadsHeader);
