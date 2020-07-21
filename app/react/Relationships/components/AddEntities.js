import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import SidePanel from 'app/Layout/SidePanel';
import SearchResults from 'app/Connections/components/SearchResults';
import { Icon } from 'UI';
import { closePanel } from '../actions/uiActions';
import SearchForm from './SearchEntitiesForm';
import * as actions from '../actions/actions';
import { Translate } from 'app/I18N';

export class AddEntities extends Component {
  constructor(props) {
    super(props);
    this.addEntity = this.addEntity.bind(this);
  }

  addEntity(_sharedId, entity) {
    this.props.addEntity(this.props.hubIndex, this.props.rightRelationshipIndex, entity);
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
          <button type="button" className="btn btn-success">
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
  addEntity: PropTypes.func,
  searchResults: PropTypes.object,
  hubIndex: PropTypes.number,
  rightRelationshipIndex: PropTypes.number,
  closePanel: PropTypes.func,
};

export const mapStateToProps = ({ relationships }) => ({
  uiState: relationships.uiState,
  searchResults: relationships.searchResults,
  hubIndex: relationships.hubActions.getIn(['addTo', 'hubIndex']),
  rightRelationshipIndex: relationships.hubActions.getIn(['addTo', 'rightRelationshipIndex']),
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ addEntity: actions.addEntity, closePanel }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AddEntities);
