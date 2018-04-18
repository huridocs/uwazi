import 'app/Templates/scss/templates.scss';

import { DragDropContext } from 'react-dnd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import HTML5Backend from 'react-dnd-html5-backend';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { resetTemplate, saveTemplate, saveEntity } from 'app/Templates/actions/templateActions';
import { saveRelationType } from 'app/RelationTypes/actions/relationTypeActions';
import MetadataTemplate from 'app/Templates/components/MetadataTemplate';
import PropertyOption from 'app/Templates/components/PropertyOption';
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

    if (this.props.relationType) {
      save = this.props.saveRelationType;
      backUrl = '/settings/connections';
    }

    return (
      <div className="metadata">
        <div className="panel panel-default">
          <div className="panel-heading">
            Metadata creator
          </div>
          <div className="panel-body">
            <div className="row">
              <main className="col-xs-12 col-sm-9">
                <MetadataTemplate saveTemplate={save} backUrl={backUrl} relationType={this.props.relationType}/>
              </main>
              <ShowIf if={!this.props.relationType}>
                <aside className="col-xs-12 col-sm-3">
                  <div className="metadataTemplate-constructor">
                    <div><i>Properties</i></div>
                    <ul className="list-group">
                      <PropertyOption label="Text" type="text"/>
                      <PropertyOption label="Numeric" type="numeric"/>
                      <PropertyOption label="Select" type="select" disabled={this.props.noDictionaries} />
                      <PropertyOption label="Multi Select" type="multiselect" disabled={this.props.noDictionaries} />
                      <ShowIf if={!this.props.relationType}>
                        <PropertyOption label="Relationship" type="relationship" disabled={this.props.noRelationtypes} />
                      </ShowIf>
                      <PropertyOption label="Date" type="date"/>
                      <PropertyOption label="Date Range" type="daterange"/>
                      <PropertyOption label="Multi Date" type="multidate"/>
                      <PropertyOption label="Multi Date Range" type="multidaterange"/>
                      <PropertyOption label="Rich Text" type="markdown"/>
                      <PropertyOption label="Geolocation" type="geolocation"/>
                      <ShowIf if={this.props.settings.collection.toJS().project === 'cejil'}>
                        <PropertyOption label="Violated articles" type="nested"/>
                      </ShowIf>
                    </ul>
                    <ShowIf if={this.props.noRelationtypes}>
                      <div className="alert alert-warning">
                        Relationship fields can not be added untill you have at least one relationship type to select.
                      </div>
                    </ShowIf>
                  </div>
                </aside>
              </ShowIf>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

TemplateCreator.propTypes = {
  resetTemplate: PropTypes.func,
  saveTemplate: PropTypes.func,
  saveEntity: PropTypes.func,
  saveRelationType: PropTypes.func,
  entity: PropTypes.bool,
  relationType: PropTypes.bool,
  noRelationtypes: PropTypes.bool,
  noDictionaries: PropTypes.bool,
  settings: PropTypes.object
};

TemplateCreator.contextTypes = {
  router: PropTypes.object
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resetTemplate, saveTemplate, saveEntity, saveRelationType }, dispatch);
}

const mapStateToProps = ({ settings, relationTypes, thesauris }) => ({
    settings,
    noRelationtypes: !relationTypes.size,
    noDictionaries: !thesauris.size
});

export default DragDropContext(HTML5Backend)(
  connect(mapStateToProps, mapDispatchToProps)(TemplateCreator)
);
