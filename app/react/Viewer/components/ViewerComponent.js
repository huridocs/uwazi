import { Map } from 'immutable';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import EntityView from 'app/Viewer/EntityView';
import Loader from 'app/components/Elements/Loader';
import { entityDefaultDocument } from 'shared/entityDefaultDocument';

import PDFView from '../PDFView';

export class ViewerComponent extends Component {
  render() {
    const { entity, document } = this.props;
    if (!entity.get('_id')) {
      return <Loader />;
    }

    return document ? <PDFView {...this.props} /> : <EntityView {...this.props} />;
  }
}

ViewerComponent.propTypes = {
  entity: PropTypes.instanceOf(Map).isRequired,
  document: PropTypes.object,
};

const mapStateToProps = state => {
  const entity = state.documentViewer.doc.get('_id')
    ? state.documentViewer.doc
    : state.entityView.entity;

  const defaultLanguage = state.settings.collection
    .get('languages')
    .find(l => l.get('default'))
    .get('key');

  return {
    entity,
    document: entity.get('documents')
      ? entityDefaultDocument(entity.get('documents').toJS(), entity.language, defaultLanguage)
      : null,
  };
};

export default connect(mapStateToProps)(ViewerComponent);
