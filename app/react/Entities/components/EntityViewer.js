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
  // --------------

  groupReferences(references) {
    const groupedReferences = {};
    references.forEach((ref) => {
      if (Object.keys(groupedReferences).indexOf(ref.sourceProperty) === -1) {
        groupedReferences[ref.sourceProperty] = {};
      }

      if (Object.keys(groupedReferences[ref.sourceProperty]).indexOf(ref.connectedDocumentTemplate) === -1) {
        groupedReferences[ref.sourceProperty][ref.connectedDocumentTemplate] = [];
      }

      groupedReferences[ref.sourceProperty][ref.connectedDocumentTemplate].push(ref);
    });

    return groupedReferences;
  }

  renderReferences() {

  }

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
    const referencesHtml = Object.keys(groupedReferences).map((propertyName, propertyIndex) =>
      Object.keys(groupedReferences[propertyName]).map((templateId, templateIndex) =>
        <div>
          <div className="item-group-header" key={propertyIndex + '-' + templateIndex}>
            Is <b>{propertyName}</b> in <b>{templateId}</b> ({groupedReferences[propertyName][templateId].length})
          </div>
          <div className="item-group">
            {groupedReferences[propertyName][templateId].map((reference, index) => {
              let referenceIcon = 'fa-sign-out';
              if (reference.inbound) {
                referenceIcon = typeof reference.range.start === 'undefined' ? 'fa-globe' : 'fa-sign-in';
              }
              return (
                <div key={index} className="item">
                  <div className="item-info">
                    <div className="item-name">
                      <i className={`fa ${referenceIcon}`}></i>
                      &nbsp;{reference.connectedDocumentTitle}
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
                    <NeedAuthorization>
                      <ShowIf if={reference.sourceType !== 'metadata'}>
                        <a className="item-shortcut" onClick={this.deleteReference.bind(this, reference)}>
                          <i className="fa fa-unlink"></i>&nbsp;<span>Delete</span>
                        </a>
                      </ShowIf>
                    </NeedAuthorization>
                    &nbsp;
                    <Link to={'/document/' + reference.connectedDocument} onClick={e => e.stopPropagation()} className="item-shortcut">
                      <span className="itemShortcut-arrow">
                        <i className="fa fa-external-link"></i>
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )
    );

    return (
      <div className="row">
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
            <ul className="nav nav-tabs">
              <li>
                <div className="tab-link tab-link-active">
                  <i className="fa fa-sitemap"></i>
                  <span className="connectionsNumber">{references.length}</span>
                </div>
              </li>
            </ul>
            &nbsp;
          </div>
          <div className="sidepanel-body">
            {referencesHtml}
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
  deleteReference: PropTypes.func
};

EntityViewer.contextTypes = {
  confirm: PropTypes.func
};

const mapStateToProps = (state) => {
  let entity = state.entityView.entity.toJS();
  let templates = state.templates.toJS();
  let thesauris = state.thesauris.toJS();
  let relationTypes = state.relationTypes.toJS();

  let references = state.entityView.references.filterNot(ref => ref.get('sourceDocument') === entity._id && ref.get('sourceType') === 'metadata');
  return {
    rawEntity: entity,
    templates,
    relationTypes,
    entity: formater.prepareMetadata(entity, templates, thesauris),
    references,
    entityBeingEdited: !!state.entityView.entityForm._id
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    loadInReduxForm: actions.loadInReduxForm,
    deleteEntity,
    deleteReference
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EntityViewer);
