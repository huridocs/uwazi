/** @format */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Translate, I18NLink } from '#app/I18N/index.js';
import { Icon } from '#UI/index.js';
import { actions } from '#app/BasicReducer/index.js';
import Immutable from 'immutable';
import { buildEntityViewLink } from '#app/utils/entityViewerPaths.js';

class ViewDocButton extends Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    e.stopPropagation();
    const { targetReference, openReferencesTab } = this.props;
    if (targetReference) {
      openReferencesTab();
    }
  }

  render() {
    const { sharedId, processed, searchTerm, file, targetReference, icon, entityViewerV2 } =
      this.props;
    const isEntity = !file;

    const documentViewUrl = buildEntityViewLink({
      sharedId,
      searchTerm,
      entityViewerV2,
      refId: targetReference ? targetReference.get('_id') : undefined,
    });

    if (!processed && !isEntity) {
      return false;
    }

    return (
      <I18NLink
        to={documentViewUrl}
        className="btn btn-default btn-xs view-doc"
        onClick={this.onClick}
      >
        <Icon icon={icon} /> <Translate>View</Translate>
      </I18NLink>
    );
  }
}

ViewDocButton.defaultProps = {
  icon: 'angle-right',
  searchTerm: '',
  processed: false,
  targetReference: null,
  entityViewerV2: false,
};

ViewDocButton.propTypes = {
  file: PropTypes.object,
  sharedId: PropTypes.string.isRequired,
  processed: PropTypes.bool,
  searchTerm: PropTypes.string,
  targetReference: PropTypes.instanceOf(Immutable.Map),
  openReferencesTab: PropTypes.func.isRequired,
  icon: PropTypes.string,
  entityViewerV2: PropTypes.bool,
};

export function mapStateToProps(state, props) {
  return {
    searchTerm: props.storeKey ? state[props.storeKey].search.searchTerm : '',
    entityViewerV2: Boolean(
      state.settings?.collection?.getIn(['features', 'featureFlagEntityViewerv2'])
    ),
  };
}

export function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      openReferencesTab: () => _dispatch =>
        _dispatch(actions.set('viewer.sidepanel.tab', 'references')),
    },
    dispatch
  );
}

const ViewDocButtonConnected = connect(mapStateToProps, mapDispatchToProps)(ViewDocButton);
export { ViewDocButton as ViewDocButtonView, ViewDocButtonConnected as ViewDocButton };
