// TEST!!!
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { NeedAuthorization } from '#app/Auth/index.js';
import { t } from '#app/I18N/index.js';
import Icon from '#UI/Icon/Icon.jsx';

import * as actions from '#app/Relationships/actions/actions.js';
import { ClientEntitySchema, IStore } from '#app/istore.js';

type RelationshipsFormButtonsProps = {
  editing: boolean | undefined;
  saving: boolean | undefined;
  parentEntity: ClientEntitySchema;
  searchResults: [];
  edit: (value: boolean, searchResults: [], parentEntity: ClientEntitySchema) => () => void;
  save: () => void;
};
class RelationshipsFormButtons extends Component<RelationshipsFormButtonsProps, MapDispatchToProps> {
  constructor(props: RelationshipsFormButtonsProps) {
    super(props);
    this.edit = this.edit.bind(this);
  }

  componentWillUnmount() {
    this.edit(false)();
  }

  edit(value: boolean) {
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

type MapStateToProps = {
  editing: boolean | undefined;
  saving: boolean | undefined;
  parentEntity: ClientEntitySchema;
  searchResults: [];
};

type MapDispatchToProps = {
  edit: (value: boolean) => () => void;
  save: () => void;
};

const mapStateToProps = (state: IStore) => ({
  editing: state.relationships.hubActions.get('editing'),
  saving: state.relationships.hubActions.get('saving'),
  parentEntity: state.relationships.list.entity,
  searchResults: state.relationships.list.searchResults,
});

function mapDispatchToProps(): MapDispatchToProps {
  return {
    edit: (value: boolean) => () => actions.edit(value),
    save: () => actions.saveRelationships(),
  };
}

export { RelationshipsFormButtons };

export default connect<MapStateToProps, MapDispatchToProps, RelationshipsFormButtonsProps, IStore>(mapStateToProps, mapDispatchToProps)(RelationshipsFormButtons);
