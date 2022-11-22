import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Icon } from 'UI';
import SidePanel from 'app/Layout/SidePanel';
import { Translate } from 'app/I18N';

import { closePanel } from '../actions/uiActions';
import { setRelationType, setTargetDocument } from '../actions/actions';
import ActionButton from './ActionButton';
import SearchForm from './SearchForm';
import SearchResults from './SearchResults';

class CreateConnectionPanel extends Component {
  renderCheckType(template) {
    if (this.props.connection.get('template') === template.get('_id')) {
      return <Icon icon="check" />;
    }

    return <Icon icon={['far', 'square']} />;
  }

  render() {
    const { uiState, searchResults } = this.props;
    const connection = this.props.connection.toJS();
    const open = Boolean(
      this.props.uiState.get('open') && this.props.containerId === connection.sourceDocument
    );
    const className = `${this.props.className} create-reference`;

    return (
      <SidePanel open={open} className={className}>
        <div className="sidepanel-header">
          <h1>
            {connection.type === 'basic' && <Translate>Create Connection</Translate>}
            {connection.type !== 'basic' && <Translate>Create Reference</Translate>}
          </h1>
          <button
            className="closeSidepanel close-modal"
            onClick={this.props.closePanel}
            aria-label="Close side panel"
            type="button"
          >
            <Icon icon="times" />
          </button>
          <div className="connections-list-title">
            <Translate>Select relationship type</Translate>
          </div>
          <ul className="connections-list multiselect">
            {this.props.relationTypes.map(template => (
              <li
                onClick={() => this.props.setRelationType(template.get('_id'))}
                key={template.get('_id')}
                className="multiselectItem"
              >
                <label className="multiselectItem-label" htmlFor={template.get('_id')}>
                  <span className="multiselectItem-icon">{this.renderCheckType(template)}</span>
                  <span className="multiselectItem-name">{template.get('name')}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidepanel-footer">
          <div className="btn-cluster content-right">
            <button
              className="btn btn-default"
              onClick={this.props.closePanel}
              aria-label="Close side panel"
              type="button"
            >
              <Translate>Cancel</Translate>
            </button>
            {connection.type !== 'targetRanged' && (
              <ActionButton
                action="save"
                onCreate={reference => {
                  this.props.onCreate(reference);
                }}
              />
            )}
            {connection.type === 'targetRanged' && (
              <ActionButton action="connect" onRangedConnect={this.props.onRangedConnect} />
            )}
          </div>
        </div>

        <div className="sidepanel-body">
          <div className="search-box">
            <SearchForm connectionType={connection.type} />
          </div>
          <SearchResults
            results={searchResults}
            searching={uiState.get('searching')}
            selected={connection.targetDocument}
            onClick={this.props.setTargetDocument}
          />
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
  relationTypes: PropTypes.object,
  setRelationType: PropTypes.func,
  setTargetDocument: PropTypes.func,
  searchResults: PropTypes.object,
  onCreate: PropTypes.func,
  onRangedConnect: PropTypes.func,
  closePanel: PropTypes.func,
};

const mapStateToProps = ({ connections, relationTypes }) => ({
  uiState: connections.uiState,
  connection: connections.connection,
  searchResults: connections.searchResults,
  relationTypes,
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ setRelationType, setTargetDocument, closePanel }, dispatch);
}

export { CreateConnectionPanel, mapStateToProps };

export default connect(mapStateToProps, mapDispatchToProps)(CreateConnectionPanel);
