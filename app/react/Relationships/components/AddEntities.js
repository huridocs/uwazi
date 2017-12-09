import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {closePanel} from '../actions/uiActions';

import SidePanel from 'app/Layout/SidePanel';
import SearchForm from './SearchEntitiesForm';
import SearchResults from 'app/Connections/components/SearchResults';

import * as actions from '../actions/actions';

export class AddEntities extends Component {
  constructor(props) {
    super(props);
    this.addEntity = this.addEntity.bind(this);
  }

  addEntity(sharedId, entity) {
    this.props.addEntity(this.props.hubIndex, this.props.rightRelationshipIndex, entity);
  }

  render() {
    const {uiState, searchResults} = this.props;
    const open = Boolean(this.props.uiState.get('open'));

    return (
      <SidePanel open={open} className="create-reference">
        <div className="sidepanel-header">
          <h1>Add entities / documents</h1>
          <i className="closeSidepanel fa fa-close close-modal" onClick={this.props.closePanel}></i>

          <div className="search-form">
            <SearchForm />
          </div>
        </div>

        <div className="sidepanel-body">
          <SearchResults
            results={searchResults}
            searching={uiState.get('searching')}
            onClick={this.addEntity}/>
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
  closePanel: PropTypes.func
};

export const mapStateToProps = ({relationships}) => {
  return {
    uiState: relationships.uiState,
    searchResults: relationships.searchResults,
    hubIndex: relationships.edit.get('hubIndex'),
    rightRelationshipIndex: relationships.edit.get('rightRelationshipIndex')
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({addEntity: actions.addEntity, closePanel}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AddEntities);
