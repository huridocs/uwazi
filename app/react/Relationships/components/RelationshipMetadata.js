import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {fromJS as Immutable} from 'immutable';

import {formater, ShowMetadata} from 'app/Metadata';
import {MetadataFormButtons} from 'app/Metadata';
import {unselectConnection} from '../actions/actions';
import SidePanel from 'app/Layout/SidePanel';
import {createSelector} from 'reselect';

export class RelationshipMetadata extends Component {

  render() {
    return (
      <SidePanel open={this.props.selectedConnection} className="connections-metadata">
        <i className="closeSidepanel fa fa-close close-modal" onClick={this.props.unselectConnection}></i>
        <div className="sidepanel-body">
          <ShowMetadata entity={this.props.selectedConnectionMetadata} showTitle={true} showType={true} />
        </div>
        <div className="sidepanel-footer">
          <MetadataFormButtons exclusivelyViewButton={true} data={Immutable(this.props.selectedConnectionMetadata)}/>
        </div>
      </SidePanel>
    );
  }
}

RelationshipMetadata.propTypes = {
  selectedConnection: PropTypes.bool,
  selectedConnectionMetadata: PropTypes.object,
  unselectConnection: PropTypes.func
};

const connectionSelector = createSelector(
  state => state.relationships.connection,
  entity => entity.toJS()
);

const selectTemplates = createSelector(s => s.templates, template => template);
const selectThesauris = createSelector(s => s.thesauris, thesauri => thesauri);

const prepareConnectionMetadata = createSelector(
  connectionSelector,
  selectTemplates,
  selectThesauris,
  (entity, templates, thesauris) => formater.prepareMetadata(entity, templates, thesauris)
);

const mapStateToProps = (state) => {
  return {
    selectedConnection: Boolean(state.relationships.connection && state.relationships.connection.get('_id')),
    selectedConnectionMetadata: prepareConnectionMetadata(state)
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    unselectConnection
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RelationshipMetadata);
