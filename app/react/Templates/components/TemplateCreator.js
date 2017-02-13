import React, {Component, PropTypes} from 'react';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {resetTemplate, saveTemplate, saveEntity} from 'app/Templates/actions/templateActions';
import PropertyOption from 'app/Templates/components/PropertyOption';
import MetadataTemplate from 'app/Templates/components/MetadataTemplate';
import 'app/Templates/scss/templates.scss';
import ShowIf from 'app/App/ShowIf';

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
              <PropertyOption label='Numeric' type='numeric'/>
              <PropertyOption label='Select' type='select'/>
              <PropertyOption label='Multi Select' type='multiselect'/>
              <PropertyOption label='Date' type='date'/>
              <PropertyOption label='Rich Text' type='markdown'/>
              <ShowIf if={this.props.settings.collection.toJS().project === 'cejil'}>
                <PropertyOption label='Violated articles' type='nested'/>
              </ShowIf>
              <ShowIf if={this.props.settings.collection.toJS().project === 'cejil'}>
                <PropertyOption label='Multi Date' type='multidate'/>
              </ShowIf>
              <ShowIf if={this.props.settings.collection.toJS().project === 'cejil'}>
                <PropertyOption label='Multi Date Range' type='multidaterange'/>
              </ShowIf>
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
  entity: PropTypes.bool,
  settings: PropTypes.object
};

TemplateCreator.contextTypes = {
  router: PropTypes.object
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({resetTemplate, saveTemplate, saveEntity}, dispatch);
}

const mapStateToProps = (state) => {
  return {
    settings: state.settings
  };
};

export default DragDropContext(HTML5Backend)(
  connect(mapStateToProps, mapDispatchToProps)(TemplateCreator)
);
