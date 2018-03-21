import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {closePanel} from '../actions/uiActions';
import {setRelationType, setTargetDocument} from '../actions/actions';

import SidePanel from 'app/Layout/SidePanel';
import SearchForm from './SearchForm';
import SearchResults from './SearchResults';
import ActionButton from './ActionButton';
import ShowIf from 'app/App/ShowIf';

export class CreateConnectionPanel extends Component {
  renderCheckType(template) {
    if (this.props.connection.get('template') === template.get('_id')) {
      return <i className="fa fa-check"></i>;
    }

    return <i className="fa fa-square-o"></i>;
  }

  render() {
    const {uiState, searchResults} = this.props;
    const connection = this.props.connection.toJS();
    const typeLabel = connection.type === 'basic' ? 'Connection' : 'Reference';
    const open = Boolean(this.props.uiState.get('open') && this.props.containerId === connection.sourceDocument);
    const pdfInfo = this.props.pdfInfo ? this.props.pdfInfo.toJS() : null;
    const className = `${this.props.className} create-reference`;

    return (
      <SidePanel open={open} className={className}>
        <div className="sidepanel-header">
          <h1>Create {typeLabel}</h1>
          <i className="closeSidepanel fa fa-close close-modal" onClick={this.props.closePanel}></i>

          <ul className="connections-list">
            {this.props.relationTypes.map((template) => {
              return <li onClick={() => this.props.setRelationType(template.get('_id'))} key={template.get('_id')}>
                {this.renderCheckType(template)}
                {template.get('name')}
              </li>;
            })}
          </ul>

          <div className="search-form">
            <SearchForm connectionType={connection.type}/>
          </div>
        </div>

        <div className="sidepanel-footer">
          <button className="btn btn-primary" onClick={this.props.closePanel}>
            <i className="fa fa-close"></i>
          </button>
          <ShowIf if={connection.type !== 'targetRanged'}>
            <ActionButton action="save" onCreate={(reference) => {
              this.props.onCreate(reference, pdfInfo);
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
  className: PropTypes.string,
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
