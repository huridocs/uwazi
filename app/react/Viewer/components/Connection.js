import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fromJS as Immutable } from 'immutable';
import { createSelector } from 'reselect';
import { Icon } from 'UI';
import { I18NLink } from 'app/I18N';
import { NeedAuthorization } from 'app/Auth';
import { withContext } from 'app/componentWrappers';
import ShowIf from 'app/App/ShowIf';
import { deleteReference } from 'app/Viewer/actions/referencesActions';
import {
  highlightReference,
  activateReference,
  selectReference,
  toggleReferences,
} from 'app/Viewer/actions/uiActions';
import { Item } from 'app/Layout';
import helpers from 'app/Documents/helpers';

const selectDoc = createSelector(
  s => s.documentViewer.targetDoc,
  s => s.documentViewer.doc,
  (targetDoc, doc) =>
    targetDoc.get('_id')
      ? helpers.performantDocToJSWithoutRelations(targetDoc)
      : helpers.performantDocToJSWithoutRelations(doc)
);

class Connection extends Component {
  clickReference(reference) {
    if (this.props.readOnly) {
      return;
    }

    if (!this.props.targetDoc) {
      this.props.activateReference(reference, this.props.referencesSection);
    }

    if (this.props.targetDoc && typeof reference.reference !== 'undefined') {
      this.props.selectReference(reference);
    }

    this.props.toggleReferences(true);
  }

  deleteReference(reference) {
    this.props.mainContext.confirm({
      accept: () => {
        this.props.deleteReference(reference);
      },
      title: 'Confirm delete connection',
      message: 'Are you sure you want to delete this connection?',
    });
  }

  relationType(id) {
    const type = this.props.relationTypes.find(relation => relation.get('_id') === id);
    if (type) {
      return type.name;
    }
  }

  render() {
    const { reference } = this.props;
    let itemClass = '';
    const disabled = this.props.targetDoc && typeof reference.reference === 'undefined';

    if (this.props.highlighted) {
      itemClass = 'relationship-hover';
    }

    if (this.props.active) {
      itemClass = 'relationship-active';
    }

    if (this.props.active && this.props.targetDoc && this.props.targetRange) {
      itemClass = 'relationship-selected';
    }

    if (this.props.readOnly) {
      itemClass = '';
    }

    const doc = Immutable(reference.associatedRelationship.entityData);
    return (
      <Item
        onMouseEnter={this.props.highlightReference.bind(null, reference._id)}
        onMouseLeave={this.props.highlightReference.bind(null, null)}
        onClick={this.clickReference.bind(this, reference)}
        doc={doc}
        noMetadata
        className={`${itemClass} item-${reference._id} ${disabled ? 'disabled' : ''} ${
          this.props.readOnly ? 'readOnly' : ''
        }`}
        data-id={reference._id}
        additionalText={
          reference.associatedRelationship.reference
            ? reference.associatedRelationship.reference.text
            : null
        }
        additionalMetadata={[
          { label: 'Connection type', value: this.relationType(reference.template) },
        ]}
        evalPublished
        buttons={
          <div className="item-shortcut-group">
            <ShowIf if={!this.props.targetDoc && !this.props.readOnly}>
              <NeedAuthorization roles={['admin', 'editor']}>
                <a
                  className="item-shortcut btn btn-default btn-hover-danger delete"
                  onClick={this.deleteReference.bind(this, reference)}
                >
                  <Icon icon="trash-alt" />
                </a>
              </NeedAuthorization>
            </ShowIf>

            <ShowIf if={!this.props.targetDoc}>
              <I18NLink
                to={`/entity/${doc.get('sharedId')}`}
                onClick={e => e.stopPropagation()}
                className="item-shortcut btn btn-default"
              >
                <Icon icon="file" />
              </I18NLink>
            </ShowIf>
          </div>
        }
      />
    );
  }
}

Connection.defaultProps = {
  targetDoc: false,
};

Connection.propTypes = {
  targetDoc: PropTypes.bool,
  readOnly: PropTypes.bool,
  highlighted: PropTypes.bool.isRequired,
  active: PropTypes.bool.isRequired,
  targetRange: PropTypes.object,
  relationTypes: PropTypes.object,
  reference: PropTypes.object.isRequired,
  highlightReference: PropTypes.func.isRequired,
  deleteReference: PropTypes.func,
  activateReference: PropTypes.func,
  selectReference: PropTypes.func,
  toggleReferences: PropTypes.func,
  referencesSection: PropTypes.string,
  mainContext: PropTypes.shape({
    confirm: PropTypes.func,
  }).isRequired,
};

const mapStateToProps = (state, ownProps) => {
  const { documentViewer } = state;
  const isActive = documentViewer.uiState.get('activeReference')
    ? documentViewer.uiState.get('activeReference') === ownProps.reference._id
    : documentViewer.uiState.get('activeReferences')?.includes(ownProps.reference._id);

  return {
    highlighted: documentViewer.uiState.get('highlightedReference') === ownProps.reference._id,
    active: isActive || false,
    targetRange: documentViewer.uiState.get('reference').get('targetRange'),
    targetDoc: !!documentViewer.targetDoc.get('_id'),
    relationTypes: documentViewer.relationTypes,
    doc: selectDoc(state),
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      highlightReference,
      activateReference,
      selectReference,
      deleteReference,
      toggleReferences,
    },
    dispatch
  );
}

export { Connection };
export default connect(mapStateToProps, mapDispatchToProps)(withContext(Connection));
