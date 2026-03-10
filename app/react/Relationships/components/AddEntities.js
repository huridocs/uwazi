import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Immuable from 'immutable';

import SidePanel from 'app/Layout/SidePanel';
import SearchResults from 'app/Connections/components/SearchResults';
import { loadInReduxForm } from 'app/Metadata/actions/actions';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { closePanel } from '../actions/uiActions';
import SearchForm from './SearchEntitiesForm';
import * as actions from '../actions/actions';

class AddEntities extends Component {
  constructor(props) {
    super(props);
    this.addEntity = this.addEntity.bind(this);
    this.newEntity = this.newEntity.bind(this);
  }

  addEntity(_sharedId, entity) {
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

AddEntities.propTypes = {
  uiState: PropTypes.object,
  addEntity: PropTypes.func.isRequired,
  searchResults: PropTypes.object,
  templates: PropTypes.instanceOf(Immuable.List).isRequired,
  hubIndex: PropTypes.number,
  rightRelationshipIndex: PropTypes.number,
  closePanel: PropTypes.func.isRequired,
  loadInReduxForm: PropTypes.func.isRequired,
  selectConnection: PropTypes.func.isRequired,
};

const mapStateToProps = ({ relationships, templates }) => ({
  uiState: relationships.uiState,
  searchResults: relationships.searchResults,
  hubIndex: relationships.hubActions.getIn(['addTo', 'hubIndex']),
  rightRelationshipIndex: relationships.hubActions.getIn(['addTo', 'rightRelationshipIndex']),
  templates,
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      addEntity: actions.addEntity,
      closePanel,
      loadInReduxForm,
      selectConnection: actions.selectConnection,
    },
    dispatch
  );
}

export { AddEntities, mapStateToProps };

export default connect(mapStateToProps, mapDispatchToProps)(AddEntities);
