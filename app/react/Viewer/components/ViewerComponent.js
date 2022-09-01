import { Map } from 'immutable';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import EntityView from 'app/Viewer/EntityView';
import Loader from 'app/components/Elements/Loader';
import { actions } from 'app/BasicReducer';
import PDFView from '../PDFView';

export class ViewerComponent extends Component {
  constructor(props, context) {
    super(props, context);
    props.setSidepanelTrigger();
  }

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
  setSidepanelTrigger: PropTypes.func.isRequired,
};

const setSidepanelTrigger = () => actions.set('library.sidepanel.trigger', 'entityViewer');

const mapStateToProps = state => {
  const entity = state.documentViewer.doc.get('_id')
    ? state.documentViewer.doc
    : state.entityView.entity;

  return {
    entity,
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setSidepanelTrigger,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewerComponent);
