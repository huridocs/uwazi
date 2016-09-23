// ENTIRE COMPONENT IS UNTESTED!!!!
// There is partial testing of added functionality, but this requires a full test.
import React, {Component, PropTypes} from 'react';
import Helmet from 'react-helmet';
import {Link} from 'react-router';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {formater, ShowMetadata} from 'app/Metadata';
import ShowIf from 'app/App/ShowIf';
import {NeedAuthorization} from 'app/Auth';
import {browserHistory} from 'react-router';
import {deleteEntity, deleteReference} from 'app/Entities/actions/actions';
import {actions} from 'app/Metadata';
import EntityForm from '../containers/EntityForm';
import {TemplateLabel} from 'app/Layout';
import {Tabs, TabLink, TabContent} from 'react-tabs-redux';
import {showTab} from '../actions/uiActions';

import TimelineViewer from 'app/Timeline/components/TimelineViewer';

export class EntityViewer extends Component {

  deleteEntity() {
    this.context.confirm({
      accept: () => {
        this.props.deleteEntity(this.props.rawEntity)
        .then(() => {
          browserHistory.push('/');
        });
      },
      title: 'Confirm delete',
      message: 'Are you sure you want to delete this entity?'
    });
  }

  // TESTED -----
  deleteReference(reference) {
    if (reference.sourceType !== 'metadata') {
      this.context.confirm({
        accept: () => {
          this.props.deleteReference(reference);
        },
        title: 'Confirm delete connection',
        message: 'Are you sure you want to delete this connection?'
      });
    }
  }

  conformGroupData(connectionType, groupedReferences, options) {
    let {key, connectionLabel, templateLabel} = options;
    let groupData = groupedReferences.find(ref => ref.key === key);

    if (!groupData) {
      groupData = {key, connectionType, connectionLabel, templateLabel, refs: []};
      groupedReferences.push(groupData);
    }

    return groupData;
  }

  getGroupData(reference, groupedReferences) {
    const referenceTemplate = this.props.templates
                              .find(t => t._id === reference.connectedDocumentTemplate);

    if (reference.sourceType === 'metadata') {
      return this.conformGroupData('metadata', groupedReferences, {
        key: reference.sourceProperty + '-' + reference.connectedDocumentTemplate,
        connectionLabel: referenceTemplate
                         .properties
                         .find(p => p.name === reference.sourceProperty)
                         .label,
        templateLabel: referenceTemplate.name
      });
    }

    if (reference.sourceType !== 'metadata') {
      return this.conformGroupData('connection', groupedReferences, {
        key: reference.relationType + '-' + reference.connectedDocumentTemplate,
        connectionLabel: this.props.relationTypes.find(r => r._id === reference.relationType).name,
        templateLabel: referenceTemplate ? referenceTemplate.name : 'documents without metadata'
      });
    }
  }

  groupReferences() {
    const references = this.props.references.toJS();
    const groupedReferences = [];
    references.forEach((reference) => {
      const groupData = this.getGroupData(reference, groupedReferences);
      groupData.refs.push(reference);
    });

    return groupedReferences;
  }

  // --------------

  // This is aparently NOT being used!
  // relationType(id, relationTypes) {
  //   let type = relationTypes.find((relation) => relation._id === id);
  //   if (type) {
  //     return type.name;
  //   }
  // }

  render() {
    // let {entity, entityBeingEdited, references, relationTypes} = this.props;
    let {entity, entityBeingEdited, references} = this.props;
    references = references.toJS();

    const groupedReferences = this.groupReferences(references);
    const referencesHtml = groupedReferences.map((group) =>
      <div className="item-group" key={group.key}>
        <div className="item-group-header">
          <ShowIf if={group.connectionType === 'metadata'}>
            <div>Is <b>{group.connectionLabel}</b> in <b>{group.templateLabel}</b> <span className="count">{group.refs.length}</span></div>
          </ShowIf>
          <ShowIf if={group.connectionType === 'connection'}>
            <div>Connected as <b>{group.connectionLabel}</b> in <b>{group.templateLabel}</b> <span className="count">{group.refs.length}</span></div>
          </ShowIf>
        </div>
        {group.refs.map((reference, index) => {
          let referenceIcon = 'fa-sign-out';
          if (reference.inbound) {
            referenceIcon = typeof reference.range.start === 'undefined' ? '' : 'fa-sign-in';
          }

          return (
            <div key={index} className='item'>
              <div className="item-info">
                <div className="item-name">
                  <i className={`fa ${referenceIcon}`}></i>
                  {reference.connectedDocumentTitle}
                  {(() => {
                    if (reference.text) {
                      return <div className="item-snippet">
                        {reference.text}
                      </div>;
                    }
                  })()}
                </div>
              </div>
              <div className="item-actions">
                <div className="item-label-group">
                  <TemplateLabel template={reference.connectedDocumentTemplate}/>
                  &nbsp;&nbsp;
                  <ShowIf if={!reference.connectedDocumentPublished}>
                    <span className="label label-warning">
                      <i className="fa fa-warning"></i> Unpublished
                    </span>
                  </ShowIf>
                </div>
                <div className="item-shortcut-group">
                  <NeedAuthorization>
                    <ShowIf if={reference.sourceType !== 'metadata'}>
                      <a className="item-shortcut" onClick={this.deleteReference.bind(this, reference)}>
                        <i className="fa fa-trash"></i>
                      </a>
                    </ShowIf>
                  </NeedAuthorization>
                  &nbsp;
                  <Link
                    to={`/${reference.connectedDocumentType}/${reference.connectedDocument}`}
                    onClick={e => e.stopPropagation()}
                    className="item-shortcut">
                    <span className="itemShortcut-arrow">
                      <i className="fa fa-external-link"></i>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );

    return (
      <div className="row entity-content">
        <Helmet title="Entity" />
        <aside className="side-panel entity-metadata">
          <ShowIf if={!entityBeingEdited}>
            <div className="sidepanel-header">

            </div>
          </ShowIf>
          <div className="sidepanel-footer">
            <NeedAuthorization>
              <ShowIf if={!entityBeingEdited}>
                <button
                  onClick={() => this.props.loadInReduxForm('entityView.entityForm', this.props.rawEntity, this.props.templates)}
                  className="edit-metadata btn btn-primary">
                  <i className="fa fa-pencil"></i>
                  <span className="btn-label">Edit</span>
                </button>
              </ShowIf>
            </NeedAuthorization>
            <ShowIf if={entityBeingEdited}>
              <button type="submit" form="metadataForm" className="edit-metadata btn btn-success">
                <i className="fa fa-save"></i>
                <span className="btn-label">Save</span>
              </button>
            </ShowIf>
            <NeedAuthorization>
              <button className="edit-metadata btn btn-danger" onClick={this.deleteEntity.bind(this)}>
                <i className="fa fa-trash"></i>
                <span className="btn-label">Delete</span>
              </button>
            </NeedAuthorization>
          </div>
          <div className="sidepanel-body">
            <ShowIf if={!entityBeingEdited}>
              <h1 className="item-name">{entity.title}</h1>
            </ShowIf>
            <ShowIf if={!entityBeingEdited}>
              <span className="item-type item-type-2">
                <i className="item-type__icon fa fa-bank"></i>
                <span className="item-type__name">{entity.documentType}</span>
              </span>
            </ShowIf>

            {(() => {
              if (entityBeingEdited) {
                return <EntityForm/>;
              }
              return <ShowMetadata entity={entity} showTitle={false} showType={false} />;
            })()}

          </div>
        </aside>
        <aside className="side-panel entity-connections">
          <div className="sidepanel-header">
            <ShowIf if={entity.template !== 'cd951f1feec188a75916812d43252418'}>
              <Tabs selectedTab={this.props.tab || 'connections'}
                    handleSelect={tab => {
                      this.props.showTab(tab);
                    }}>
                <ul className="nav nav-tabs">
                  <li>
                    <TabLink to="connections">
                      <i className="fa fa-sitemap"></i>
                      <span className="connectionsNumber">{this.props.references.size}</span>
                    </TabLink>
                  </li>
                </ul>
              </Tabs>
            </ShowIf>
            <ShowIf if={entity.template === 'cd951f1feec188a75916812d43252418'}>
              <Tabs selectedTab={this.props.tab || 'connections'}
                    handleSelect={tab => {
                      this.props.showTab(tab);
                    }}>
                <ul className="nav nav-tabs">
                  <li>
                    <TabLink to="connections">
                      <i className="fa fa-sitemap"></i>
                      <span className="connectionsNumber">{this.props.references.size}</span>
                    </TabLink>
                  </li>
                  <li>
                    <TabLink to="timeline" default>
                      <i className="fa fa-clock-o"></i>
                    </TabLink>
                  </li>
                </ul>
              </Tabs>
            </ShowIf>
            &nbsp;
          </div>
          <div className="sidepanel-body">
            <Tabs selectedTab={this.props.tab || 'connections'}>
              <TabContent for="connections">
                <div className="timeline">
                  <div className="timeline-track">
                    <div className="timeline-year">
                      <div data-year="2003" className="timeline-item" data-toggle="tooltip" data-placement="top" data-animation="false" title="10 de noviembre de 2003 Denuncia"></div>
                    </div>
                    <div className="timeline-year"></div>
                    <div className="timeline-year"></div>
                    <div className="timeline-year">
                      <div data-year="2006" className="timeline-item timeline-item-type-5" data-toggle="tooltip" data-placement="top" data-animation="false" title="21 de octubre de 2006 Rosendo Cantú y otros. Informe de Admisibilidad Nº 93/06"></div>
                    </div>
                    <div className="timeline-year"></div>
                    <div className="timeline-year"></div>
                    <div className="timeline-year">
                      <div data-year="2009" className="timeline-item" data-toggle="tooltip" data-placement="top" data-animation="false" title="2 de agosto de 2009 Envío a la Corte"></div>
                    </div>
                    <div className="timeline-year">
                      <div data-year="2010" className="timeline-item" data-toggle="tooltip" data-placement="top" data-animation="false" title="2 de febrero de 2010 Rosendo Cantú y otra. Resolución de la CorteIDH de 2 de febrero de 2010"></div>
                      <div data-year="2010" className="timeline-item" data-toggle="tooltip" data-placement="top" data-animation="false" title="23 de abril de 2010 Rosendo Cantú y otra. Resolución del Presidente de 23 de abril de 2010"></div>
                      <div data-year="2010" className="timeline-item" data-toggle="tooltip" data-placement="top" data-animation="false" title="19 de mayo de 2010 Rosendo Cantú y otra. Resolución de la CorteIDH de 19 de mayo de 2010"></div>
                      <div data-year="2010" className="timeline-item timeline-item-type-2" data-toggle="tooltip" data-placement="top" data-animation="false" title="31 de agosto de 2010 Rosendo Cantú y otra. Excepciones Preliminares, Fondo, Reparaciones y Costas. Sentencia de 31 de agosto de 2010"><i className="fa fa-legal"></i></div>
                      <div data-year="2010" className="timeline-item" data-toggle="tooltip" data-placement="top" data-animation="false" title="25 de noviembre de 2010 Rosendo Cantú y otra. Resolución de la CorteIDH de 25 de noviembre de 2010"></div>
                    </div>
                    <div className="timeline-year">
                      <div data-year="2011" className="timeline-item" data-toggle="tooltip" data-placement="top" data-animation="false" title="15 de mayo de 2011 Rosendo Cantu y otras. Interpretación. Sentencia de 15 de mayo de 2011"></div>
                      <div data-year="2011" className="timeline-item" data-toggle="tooltip" data-placement="top" data-animation="false" title="1 de julio de 2011 Rosendo Cantú y otra. Resolución de la CorteIDH de 1 de julio de 2011"></div>
                    </div>
                    <div className="timeline-year"></div>
                    <div className="timeline-year"></div>
                    <div className="timeline-year"></div>
                    <div className="timeline-year">
                      <div data-year="2015" className="timeline-item" data-toggle="tooltip" data-placement="top" data-animation="false" title="17 de abril de 2015 Rosendo Cantú [y otros casos]. Resolución de la CorteIDH de 17 de abril de 2015"></div>
                      <div data-year="2015" className="timeline-item" data-toggle="tooltip" data-placement="top" data-animation="false" title="23 de junio de 2015 Rosendo Cantú y otra. Resolución de la CorteIDH de 23 de junio de 2015"></div>
                    </div>
                    <div className="timeline-year">
                      <div data-year="2016" className="timeline-item" data-toggle="tooltip" data-placement="top" data-animation="false" title="23 de febrero de 2016 Rosendo Cantú y otros. Resolución de la CorteIDH de 23 de febrero de 2016"></div>
                    </div>
                  </div>
                  <div className="timeline-track">
                    <div className="timeline-year">
                      <div className="timeline-label"><span>2003</span></div>
                    </div>
                    <div className="timeline-year">
                      <div className="timeline-label"><span>2004</span></div></div>
                    <div className="timeline-year">
                      <div className="timeline-label timeline-label-text"><span>2005</span></div></div>
                    <div className="timeline-year">
                      <div className="timeline-label"><span>2006</span></div>
                    </div>
                    <div className="timeline-year">
                      <div className="timeline-label"><span>2007</span></div></div>
                    <div className="timeline-year">
                      <div className="timeline-label"><span>2008</span></div></div>
                    <div className="timeline-year">
                      <div className="timeline-label"><span>2009</span></div>
                    </div>
                    <div className="timeline-year">
                      <div className="timeline-label timeline-label-text"><span>2010</span></div>
                    </div>
                    <div className="timeline-year">
                      <div className="timeline-label"><span>2011</span></div>
                    </div>
                    <div className="timeline-year">
                      <div className="timeline-label"><span>2012</span></div></div>
                    <div className="timeline-year">
                      <div className="timeline-label"><span>2013</span></div></div>
                    <div className="timeline-year">
                      <div className="timeline-label"><span>2014</span></div></div>
                    <div className="timeline-year">
                      <div className="timeline-label timeline-label-text"><span>2015</span></div>
                    </div>
                    <div className="timeline-year">
                      <div className="timeline-label"><span>2016</span></div>
                    </div>
                  </div>
                </div>
                {referencesHtml}
              </TabContent>
              <TabContent for="timeline">
                <ShowIf if={entity.template === 'cd951f1feec188a75916812d43252418'}>
                  <TimelineViewer />
                </ShowIf>
              </TabContent>
            </Tabs>
          </div>
        </aside>
      </div>
    );
  }

}

EntityViewer.propTypes = {
  entity: PropTypes.object,
  rawEntity: PropTypes.object,
  entityBeingEdited: PropTypes.bool,
  references: PropTypes.object,
  templates: PropTypes.array,
  relationTypes: PropTypes.array,
  loadInReduxForm: PropTypes.func,
  deleteEntity: PropTypes.func,
  deleteReference: PropTypes.func,
  showTab: PropTypes.func,
  tab: PropTypes.string
};

EntityViewer.contextTypes = {
  confirm: PropTypes.func
};

const mapStateToProps = (state) => {
  let entity = state.entityView.entity.toJS();
  let templates = state.templates.toJS();
  let thesauris = state.thesauris.toJS();
  let relationTypes = state.relationTypes.toJS();


  let references = state.entityView.references
                   .filterNot(ref => ref.get('sourceDocument') === entity._id && ref.get('sourceType') === 'metadata')
                   .filter(ref => !!state.user.get('_id') || ref.get('connectedDocumentPublished'));

  return {
    rawEntity: entity,
    templates,
    relationTypes,
    entity: formater.prepareMetadata(entity, templates, thesauris),
    references,
    entityBeingEdited: !!state.entityView.entityForm._id,
    tab: state.entityView.uiState.get('tab')
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    loadInReduxForm: actions.loadInReduxForm,
    deleteEntity,
    deleteReference,
    showTab
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EntityViewer);
