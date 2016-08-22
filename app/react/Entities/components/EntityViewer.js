import React, {Component, PropTypes} from 'react';
import Helmet from 'react-helmet';
import {connect} from 'react-redux';
import {formater} from 'app/Metadata';

export class EntityViewer extends Component {

  render() {
    return (
      <div className="row">
        <Helmet title="Entity" />
        <aside className="side-panel entity-metadata">
          <div className="sidepanel-header">
            <h1 className="item-name">Entity Name</h1>
            <span className="item-type item-type-2">Entity type</span>
          </div>
          <div className="sidepanel-body">
            <div className="view">
              <dl>
                <dt>Metadata 1</dt>
                <dd>Metadata 1</dd>
              </dl>
              <dl>
                <dt>Metadata 2</dt>
                <dd>Metadata 2</dd>
              </dl>
            </div>
          </div>
        </aside>
        <aside className="side-panel entity-connections">
          <div className="sidepanel-header">
            <h1>Connections (0)</h1>
          </div>
          <div className="sidepanel-body">
            <div className="item-group">{/* Connections go here */}</div>
          </div>
        </aside>
      </div>
    );
  }

}

EntityViewer.propTypes = {
  entity: PropTypes.object
};

const mapStateToProps = (state) => {
  let entity = state.entityView.entity.toJS();
  let templates = state.templates.toJS();
  let thesauris = state.thesauris.toJS();

  return {
    entity: formater.prepareMetadata(entity, templates, thesauris)
  };
};

export default connect(mapStateToProps)(EntityViewer);
