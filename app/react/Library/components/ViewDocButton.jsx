/** @format */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Translate, I18NLink } from '#app/I18N/index.js';
import { Icon } from '#UI/index.js';
import { actions } from '#app/BasicReducer/index.js';
import url from 'url';
import Immutable from 'immutable';


function getDocumentUrlQuery(searchTerm, targetReference) {
  const query = {};
  if (searchTerm) {
    query.searchTerm = searchTerm;
  }
  if (targetReference) {
    query.ref = targetReference.get('_id');
  }
  return query;
}

export class ViewDocButton extends Component {
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
    const { sharedId, processed, searchTerm, file, targetReference, icon } = this.props;
    const isEntity = !file;

    const pathname = `/entity/${sharedId}`;
    const query = getDocumentUrlQuery(searchTerm, targetReference);
    const documentViewUrl = url.format({
      pathname,
      query,
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
};

ViewDocButton.propTypes = {
  file: PropTypes.object,
  sharedId: PropTypes.string.isRequired,
  processed: PropTypes.bool,
  searchTerm: PropTypes.string,
  targetReference: PropTypes.instanceOf(Immutable.Map),
  openReferencesTab: PropTypes.func.isRequired,
  icon: PropTypes.string,
};

export function mapStateToProps(state, props) {
  return {
    searchTerm: props.storeKey ? state[props.storeKey].search.searchTerm : '',
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

export default connect(mapStateToProps, mapDispatchToProps)(ViewDocButton);
