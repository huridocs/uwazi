/** @format */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import PDFView from '../PDFView';
import EntityView from 'app/Viewer/EntityView';
import Loader from 'app/components/Elements/Loader';

export class ViewerComponent extends Component {
  render() {
    const { entity } = this.props;
    if (!entity.get('_id')) {
      return <Loader />;
    }
    return entity.get('file') ? <PDFView {...this.props} /> : <EntityView {...this.props} />;
  }
}

ViewerComponent.contextTypes = {
  store: PropTypes.object,
};

const mapStateToProps = state => {
  const entity = state.documentViewer.doc.get('_id')
    ? state.documentViewer.doc
    : state.entityView.entity;
  return {
    entity,
  };
};

export default connect(mapStateToProps)(ViewerComponent);
