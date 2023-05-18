import 'app/Templates/scss/templates.scss';

import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { resetTemplate, saveTemplate } from 'app/Templates/actions/templateActions';
import { saveRelationType } from 'app/RelationTypes/actions/relationTypeActions';
import MetadataTemplate from 'app/Templates/components/MetadataTemplate';
import PropertyOption from 'app/Templates/components/PropertyOption';
import { Translate } from 'app/I18N';
import { DNDHTMLBackend } from 'app/App/DNDHTML5Backend';

class TemplateCreator extends Component {
  componentWillUnmount() {
    this.props.resetTemplate();
  }

  render() {
    let save = this.props.saveTemplate;
    let backUrl = '/settings/templates';
    let environment = 'document';
    if (this.props.relationType) {
      save = this.props.saveRelationType;
      backUrl = '/settings/connections';
      environment = 'relationship';
    }

    return (
      <div className="metadata">
        <div className="panel panel-default">
          <div className="panel-heading">
            <Translate>Metadata creator</Translate>
          </div>
          <div className="panel-body">
            <div className="row">
              <main className="col-xs-12 col-sm-9">
                <MetadataTemplate
                  saveTemplate={save}
                  backUrl={backUrl}
                  relationType={this.props.relationType}
                />
              </main>
              {environment !== 'relationship' && !this.props.syncedTemplate && (
                <aside className="col-xs-12 col-sm-3">
                  <div className="metadataTemplate-constructor">
                    <div>
                      <i>
                        <Translate>Properties</Translate>
                      </i>
                    </div>
                    <ul className="list-group property-options-list">
                      <PropertyOption label="Text" type="text" />
                      <PropertyOption label="Numeric" type="numeric" />
                      <PropertyOption label="Select" type="select" />
                      {environment !== 'relationship' && (
                        <PropertyOption
                          label="Relationship"
                          type="relationship"
                          disabled={this.props.noRelationtypes}
                        />
                      )}
                      {this.props.newRelationshipsFeatureEnabled &&
                        environment !== 'relationship' && (
                          <PropertyOption
                            label="New Relationship"
                            type="newRelationship"
                            disabled={this.props.noRelationtypes}
                          />
                        )}
                      <PropertyOption label="Date" type="date" />
                      <PropertyOption label="Rich Text" type="markdown" />
                      <PropertyOption label="Link" type="link" />
                      <PropertyOption label="Image" type="image" />
                      {environment === 'document' && (
                        <PropertyOption label="Preview" type="preview" />
                      )}
                      <PropertyOption label="Media" type="media" />
                      <PropertyOption label="Geolocation" type="geolocation" />
                      {this.props.project === 'cejil' && (
                        <PropertyOption label="Violated articles" type="nested" />
                      )}
                      <PropertyOption label="Generated ID" type="generatedid" />
                    </ul>
                    {this.props.noRelationtypes && (
                      <div className="alert alert-warning">
                        <Translate translationKey="No relationship types warning">
                          Relationship fields can not be added until you have at least one
                          relationship type to select.
                        </Translate>
                      </div>
                    )}
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

TemplateCreator.defaultProps = {
  relationType: false,
  noRelationtypes: true,
  project: '',
  syncedTemplate: false,
  newRelationshipsFeatureEnabled: false,
};

TemplateCreator.propTypes = {
  resetTemplate: PropTypes.func.isRequired,
  saveTemplate: PropTypes.func.isRequired,
  saveRelationType: PropTypes.func.isRequired,
  relationType: PropTypes.bool,
  syncedTemplate: PropTypes.bool,
  noRelationtypes: PropTypes.bool,
  project: PropTypes.string,
  newRelationshipsFeatureEnabled: PropTypes.bool,
};

TemplateCreator.contextTypes = {
  router: PropTypes.object,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resetTemplate, saveTemplate, saveRelationType }, dispatch);
}

const mapStateToProps = ({ settings, relationTypes, thesauris, template }, props) => ({
  project: settings.collection.toJS().project,
  newRelationshipsFeatureEnabled: settings.collection.toJS().features?.newRelationships,
  noRelationtypes: !relationTypes.size,
  noDictionaries: !thesauris.size,
  syncedTemplate: !props.relationType && template.data.synced,
});

export { TemplateCreator };
export default DNDHTMLBackend(connect(mapStateToProps, mapDispatchToProps)(TemplateCreator));
