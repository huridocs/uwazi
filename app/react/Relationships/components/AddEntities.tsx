import PropTypes from 'prop-types';
import React, { Component, Dispatch } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Immutable from 'immutable';

import SidePanel from '#app/Layout/SidePanel.jsx';
import SearchResults from '#app/Connections/components/SearchResults.jsx';
import { loadInReduxForm } from '#app/Metadata/actions/actions.js';
import Icon from '#UI/Icon/Icon.jsx';
import { Translate } from '#app/I18N/index.js';
import { closePanel } from '#app/Viewer/actions/uiActions.js';
import SearchForm from '#app/Relationships/components/SearchEntitiesForm.js';
import * as actions from '#app/Relationships/actions/actions.js';
import { ClientEntitySchema, IStore } from '#app/istore.js';

type AddEntitiesProps = {
  uiState: Immutable.Map<string, any>;
  searchResults: [];
  addEntity: (hubIndex: number, rightRelationshipIndex: number, entity: any) => void;
  newEntity: () => void;
  hubIndex: number;
  rightRelationshipIndex: number;
  templates: Immutable.List<any>;
  selectConnection: (connection: any) => void;
  loadInReduxForm: (form: string, data: any, templates: any) => void;
  closePanel: () => void;
};


type MapDispatchToProps = {
  addEntity: (hubIndex: number, rightRelationshipIndex: number, entity: any) => void;
  closePanel: () => void;
  loadInReduxForm: (form: string, data: any, templates: any) => void;
  selectConnection: (connection: any) => void;
};

class AddEntities extends Component<AddEntitiesProps, MapDispatchToProps> {
  constructor(props: AddEntitiesProps) {
    super(props);
    this.addEntity = this.addEntity.bind(this);
    this.newEntity = this.newEntity.bind(this);
  }

  addEntity(_sharedId: string, entity: ClientEntitySchema) {
    this.props.addEntity(this.props.hubIndex, this.props.rightRelationshipIndex, entity);
  }

  newEntity() {
    this.props.selectConnection({ metadata: {} });
    this.props.loadInReduxForm(
      'relationships.metadata',
      { metadata: {} },
      this.props.templates.toJS()
    );
    this.props.closePanel();
  }

  render() {
    const { uiState, searchResults } = this.props;
    const open = Boolean(this.props.uiState.get('open'));

    return (
      <SidePanel open={open} className="create-reference">
        <div className="sidepanel-header">
          <h1>
            <Translate>Add entities / documents</Translate>
          </h1>
          <button
            type="button"
            className="closeSidepanel close-modal"
            onClick={this.props.closePanel}
          >
            <Icon icon="times" />
          </button>
        </div>

        <div className="sidepanel-body">
          <div className="search-box">
            <SearchForm />
          </div>
          <SearchResults
            results={searchResults}
            searching={uiState.get('searching')}
            onClick={this.addEntity}
          />
        </div>
        <div className="sidepanel-footer">
          <button type="button" className="btn btn-success" onClick={this.newEntity}>
            <Icon icon="plus" />
            <span className="btn-label">
              <Translate>Create Entity</Translate>
            </span>
          </button>
        </div>
      </SidePanel>
    );
  }
}

const mapStateToProps = (state: IStore) => ({
  uiState: state.relationships.uiState,
  searchResults: state.relationships.searchResults,
  hubIndex: state.relationships.hubActions.getIn(['addTo', 'hubIndex']),
  rightRelationshipIndex: state.relationships.hubActions.getIn(['addTo', 'rightRelationshipIndex']),
  templates: state.templates,
});


function mapDispatchToProps(): MapDispatchToProps {
  return {
    addEntity: actions.addEntity,
    closePanel,
    loadInReduxForm,
    selectConnection: actions.selectConnection,
  };
}

export { AddEntities, mapStateToProps };

export default connect(mapStateToProps, mapDispatchToProps)(AddEntities);
