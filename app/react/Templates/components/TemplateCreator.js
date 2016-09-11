import React, {Component, PropTypes} from 'react';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {resetTemplate, saveTemplate, saveEntity} from 'app/Templates/actions/templateActions';
import PropertyOption from 'app/Templates/components/PropertyOption';
import MetadataTemplate from 'app/Templates/components/MetadataTemplate';
import 'app/Templates/scss/templates.scss';

export class TemplateCreator extends Component {

  componentWillUnmount() {
    this.props.resetTemplate();
  }

  render() {
    let save = this.props.saveTemplate;
    let backUrl = '/settings/documents';
    if (this.props.entity) {
      save = this.props.saveEntity;
      backUrl = '/settings/entities';
    }

    return (
      <div className="row metadata">
        <main className="col-xs-12 col-sm-9">
            <MetadataTemplate saveTemplate={save} backUrl={backUrl} />
        </main>
        <aside className="col-xs-12 col-sm-3">
          <div className="metadataTemplate-constructor panel panel-default">
            <div className="panel-heading">Properties</div>
            <ul className="list-group">
              <PropertyOption label='Text' type='text'/>
              <PropertyOption label='Select' type='select'/>
              <PropertyOption label='Multi Select' type='multiselect'/>
              <PropertyOption label='Date' type='date'/>
              <PropertyOption label='Rich Text' type='markdown'/>
              <PropertyOption label='Violated articles' type='violatedarticles'/>
            </ul>
          </div>
        </aside>
      </div>
    );
  }
}

TemplateCreator.propTypes = {
  resetTemplate: PropTypes.func,
  saveTemplate: PropTypes.func,
  saveEntity: PropTypes.func,
  entity: PropTypes.bool
};

TemplateCreator.contextTypes = {
  router: PropTypes.object
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({resetTemplate, saveTemplate, saveEntity}, dispatch);
}

export default DragDropContext(HTML5Backend)(
  connect(null, mapDispatchToProps)(TemplateCreator)
);
