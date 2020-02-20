import { Map, List } from 'immutable';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import EntityView from 'app/Viewer/EntityView';
import Loader from 'app/components/Elements/Loader';
import { entityDefaultDocument } from 'shared/entityDefaultDocument';

import PDFView from '../PDFView';

export class ViewerComponent extends Component {
  render() {
    const { entity, languages } = this.props;

    if (!entity.get('_id')) {
      return <Loader />;
    }

    const defaultLanguage = languages.find(l => l.get('default')).get('key');

    const document = entity.get('documents')
      ? entityDefaultDocument(entity.get('documents').toJS(), entity.language, defaultLanguage)
      : {};

    return document ? (
      <PDFView {...this.props} document={document} />
    ) : (
      <EntityView {...this.props} />
    );
  }
}

ViewerComponent.propTypes = {
  entity: PropTypes.instanceOf(Map).isRequired,
  languages: PropTypes.instanceOf(List).isRequired,
};

const mapStateToProps = state => {
  const entity = state.documentViewer.doc.get('_id')
    ? state.documentViewer.doc
    : state.entityView.entity;

  return {
    entity,
    languages: state.settings.collection.get('languages'),
  };
};

export default connect(mapStateToProps)(ViewerComponent);
