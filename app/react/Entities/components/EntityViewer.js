import React, {Component, PropTypes} from 'react';
import Helmet from 'react-helmet';
import {connect} from 'react-redux';
import {formater} from 'app/Metadata';

export class EntityViewer extends Component {

  render() {
    console.log(this.props.references);
    let {entity} = this.props;
    return (
      <div className="row">
        <Helmet title="Entity" />
        <aside className="side-panel entity-metadata">
          <div className="sidepanel-header">
            <h1 className="item-name">{entity.title}</h1>
            <span className="item-type item-type-2">{entity.documentType}</span>
          </div>
          <div className="sidepanel-body">
            <div className="view">
              {entity.metadata.map((property, index) => {
                return (
                  <dl key={index}>
                    <dt>{property.label}</dt>
                    <dd>{property.value}</dd>
                  </dl>
                  );
              })}
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
  entity: PropTypes.object,
  references: PropTypes.array
};

const mapStateToProps = (state) => {
  let entity = state.entityView.entity.toJS();
  let templates = state.templates.toJS();
  let thesauris = state.thesauris.toJS();

  return {
    entity: formater.prepareMetadata(entity, templates, thesauris),
    references: state.entityView.references.toJS()
  };
};

export default connect(mapStateToProps)(EntityViewer);
