import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {closePanel} from '../actions/uiActions';
import {setRelationType, setTargetDocument} from '../actions/actions';

import SidePanel from 'app/Layout/SidePanel';
import {Select} from 'app/Forms';

import SearchForm from './SearchForm';
import SearchResults from './SearchResults';
import ActionButton from './ActionButton';
import ShowIf from 'app/App/ShowIf';

export class CreateConnectionPanel extends Component {
  render() {
    const {uiState, searchResults} = this.props;
    const connection = this.props.connection.toJS();
    const typeLabel = connection.type === 'basic' ? 'Connection' : 'Reference';
    const open = Boolean(this.props.uiState.get('open') && this.props.containerId === connection.sourceDocument);

    return (
      <SidePanel open={open} className="create-reference">
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
        <SearchForm connectionType={connection.type}/>
      </div>

      <div className="sidepanel-footer">
        <ShowIf if={connection.type !== 'targetRanged'}>
          <ActionButton action="save" onCreate={(reference) => {
            this.props.onCreate(reference, this.props.pdfInfo.toJS())
          }}/>
        </ShowIf>
        <ShowIf if={connection.type === 'targetRanged'}>
          <ActionButton action="connect" onRangedConnect={this.props.onRangedConnect}/>
        </ShowIf>
      </div>

      <div className="sidepanel-body">
        <SearchResults
          results={searchResults}
          searching={uiState.get('searching')}
          selected={connection.targetDocument}
          onClick={this.props.setTargetDocument}/>
      </div>
    </SidePanel>
    );
  }
}

CreateConnectionPanel.propTypes = {
  uiState: PropTypes.object,
  containerId: PropTypes.string,
  connection: PropTypes.object,
  pdfInfo: PropTypes.object,
  relationTypes: PropTypes.object,
  setRelationType: PropTypes.func,
  setTargetDocument: PropTypes.func,
  searchResults: PropTypes.object,
  onCreate: PropTypes.func,
  onRangedConnect: PropTypes.func,
  closePanel: PropTypes.func
};

export const mapStateToProps = ({connections, relationTypes, documentViewer}) => {
  return {
    uiState: connections.uiState,
    pdfInfo: documentViewer.doc.get('pdfInfo'),
    connection: connections.connection,
    searchResults: connections.searchResults,
    relationTypes: relationTypes
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setRelationType, setTargetDocument, closePanel}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateConnectionPanel);
