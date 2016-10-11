import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {closePanel} from '../actions/uiActions';
import {setRelationType, setTargetDocument} from '../actions/actions';

import SidePanel from 'app/Layout/SidePanel';
import {Select} from 'app/Forms';

import SearchForm from './SearchForm';
import SearchResults from './SearchResults';
import SaveButton from './SaveButton';
import ShowIf from 'app/App/ShowIf';

export class CreateConnectionPanel extends Component {
  render() {
    const {uiState, searchResults} = this.props;
    const connection = this.props.connection.toJS();
    const typeLabel = connection.type === 'basic' ? 'Connection' : 'Reference';

    return (
      <SidePanel open={this.props.uiState.get('open')} className="create-reference">
        <div className="sidepanel-header">
          <h1>Create {typeLabel}</h1>
          <i className="closeSidepanel fa fa-close close-modal" onClick={this.props.closePanel}></i>

          <div className="relationship-steps">
            <h2>Connection type<small>1</small></h2>
          </div>

          <Select
            value={connection.relationType}
            placeholder="Connection type..."
            optionsValue="_id"
            optionsLabel="name"
            options={this.props.relationTypes.toJS()}
            onChange={e => this.props.setRelationType(e.target.value)}/>

        <div className="relationship-steps">
          <h2>Select document<small>2</small></h2>
        </div>
        <SearchForm />
      </div>

      <div className="sidepanel-footer">
        {/*<ShowIf if={this.props.creatingToTarget}>
          <CreateTargetConnectionPanel />
        </ShowIf>
        <ShowIf if={!this.props.creatingToTarget && !this.props.creatingBasicConnection}>
          <SaveConnection />
        </ShowIf>*/}
        <ShowIf if={connection.type !== 'targetRanged'}>
          <SaveButton/>
        </ShowIf>
      </div>

      <div className="sidepanel-body">
        <SearchResults
          results={searchResults}
          searching={uiState.get('searching')}
          selected={connection.targetDocument}
          onClick={this.props.setTargetDocument}
          creatingToTarget={false}
        />
      </div>
    </SidePanel>
    );
  }
}

CreateConnectionPanel.propTypes = {
  uiState: PropTypes.object,
  connection: PropTypes.object,
  relationTypes: PropTypes.object,
  setRelationType: PropTypes.func,
  setTargetDocument: PropTypes.func,
  searchResults: PropTypes.object,
  closePanel: PropTypes.func
};

export const mapStateToProps = (state) => {
  const {connections, relationTypes} = state;
  // console.log(connections);
  // console.log(relationTypes);
  // console.log(connections.connection.toJS());
  return {
    uiState: connections.uiState,
    connection: connections.connection,
    searchResults: connections.searchResults,
    relationTypes: relationTypes
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setRelationType, setTargetDocument, closePanel}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateConnectionPanel);
