// TEST!!!
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { NeedAuthorization } from 'app/Auth';
import { t } from 'app/I18N';
import { Icon } from 'UI';

import * as actions from '../actions/actions';

class RelationshipsFormButtons extends Component {
  constructor(props) {
    super(props);
    this.edit = this.edit.bind(this);
  }

  componentWillUnmount() {
    this.edit(false)();
  }

  edit(value) {
    return () => {
      this.props.edit(value, this.props.searchResults, this.props.parentEntity);
    };
  }

  render() {
    const { editing, saving } = this.props;
    const entityData = this.props.parentEntity.toJS();

    return (
      <>
        <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[entityData]}>
          {!editing && (
            <div className="btn-cluster">
              <button
                type="button"
                onClick={this.edit(true)}
                className="edit-metadata btn btn-default"
              >
                <Icon icon="pencil-alt" />
                <span className="btn-label">{t('System', 'Edit')}</span>
              </button>
            </div>
          )}
        </NeedAuthorization>
        <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[entityData]}>
          {editing && (
            <div className="btn-cluster content-right">
              <button
                type="button"
                onClick={this.edit(false)}
                className="cancel-edit-metadata btn btn-default btn-extra-padding"
              >
                <span className="btn-label">{t('System', 'Cancel')}</span>
              </button>
              <button
                type="button"
                onClick={this.props.save}
                className="btn btn-success btn-extra-padding"
                disabled={saving}
              >
                {saving && <Icon icon="spinner" pulse fixedWidth />}
                <span className="btn-label">{t('System', 'Save')}</span>
              </button>
            </div>
          )}
        </NeedAuthorization>
      </>
    );
  }
}

RelationshipsFormButtons.propTypes = {
  editing: PropTypes.bool,
  saving: PropTypes.bool,
  edit: PropTypes.func,
  save: PropTypes.func,
  parentEntity: PropTypes.object,
  searchResults: PropTypes.object,
};

const mapStateToProps = ({ relationships }) => ({
  editing: relationships.hubActions.get('editing'),
  saving: relationships.hubActions.get('saving'),
  parentEntity: relationships.list.entity,
  searchResults: relationships.list.searchResults,
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      edit: actions.edit,
      save: actions.saveRelationships,
    },
    dispatch
  );
}

export { RelationshipsFormButtons };

export default connect(mapStateToProps, mapDispatchToProps)(RelationshipsFormButtons);
