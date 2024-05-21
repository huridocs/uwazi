import { Map } from 'immutable';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import EntityView from 'app/Viewer/EntityView';
import { Loader } from 'app/components/Elements/Loader';
import { actions } from 'app/BasicReducer';
import { t } from 'app/I18N';
import { ErrorFallback } from 'app/V2/Components/ErrorHandling';
import { PDFView } from '../PDFView';

class EntityViewerComponent extends Component {
  constructor(props, context) {
    super(props, context);
    props.setSidepanelTrigger();
  }

  render() {
    const { entity, notFound } = this.props;

    if (!entity.get('_id')) {
      if (notFound) {
        return (
          <ErrorFallback error={{ status: 404, message: t('System', 'Not Found', null, false) }} />
        );
      }
      return <Loader />;
    }

    return entity.get('defaultDoc') ? <PDFView {...this.props} /> : <EntityView {...this.props} />;
  }
}

EntityViewerComponent.defaultProps = {
  notFound: false,
};

EntityViewerComponent.propTypes = {
  entity: PropTypes.instanceOf(Map).isRequired,
  setSidepanelTrigger: PropTypes.func.isRequired,
  notFound: PropTypes.bool,
};

const setSidepanelTrigger = () => actions.set('library.sidepanel.view', 'entity');

const mapStateToProps = state => {
  const entity = state.documentViewer.doc.get('_id')
    ? state.documentViewer.doc
    : state.entityView.entity;

  const notFound = state.entityView.uiState.get('tab') === '404';
  return {
    entity,
    notFound,
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

const ViewerComponent = connect(mapStateToProps, mapDispatchToProps)(EntityViewerComponent);

export { ViewerComponent };
