import { Map } from 'immutable';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import EntityView from 'app/Viewer/EntityView';
import Loader from 'app/components/Elements/Loader';

import PDFView from '../PDFView';

export class ViewerComponent extends Component {
  render() {
    const { entity } = this.props;

    if (!entity.get('_id')) {
      return <Loader />;
    }

    return entity.get('defaultDoc') ? <PDFView {...this.props} /> : <EntityView {...this.props} />;
  }
}

ViewerComponent.propTypes = {
  entity: PropTypes.instanceOf(Map).isRequired,
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
