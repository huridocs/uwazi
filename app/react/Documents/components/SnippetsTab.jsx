import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { t } from '#app/I18N/index.js';
import { Icon } from '#UI/Icon/Icon.js';

const SnippetsTab = ({ snippets }) => (
  <div>
    <Icon icon="search" />
    <span className="connectionsNumber">{snippets.get('count') ? snippets.get('count') : ''}</span>
    <span className="tab-link-tooltip">{t('System', 'Search text')}</span>
  </div>
);

SnippetsTab.propTypes = {
  snippets: PropTypes.object,
};

function mapStateToProps(state, props) {
  return {
    snippets: state[props.storeKey].sidepanel.snippets,
  };
}

const SnippetsTabConnected = connect(mapStateToProps)(SnippetsTab);
export { SnippetsTab, SnippetsTabConnected };
