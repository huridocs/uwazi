import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import ShowIf from '#app/App/ShowIf.jsx';
import { Translate } from '#app/I18N/index.js';
import Icon from '#UI/Icon/Icon.js';

import { resetSearch } from '#app/ConnectionsList/actions/actions.js';

class ResetSearch extends Component {
  render() {
    const { connectionsGroups } = this.props;
    return (
      <ShowIf if={Boolean(connectionsGroups.size)}>
        <button type="button" onClick={this.props.resetSearch} className="btn btn-default">
          <Icon icon="times" />
          <span className="btn-label">
            <Translate>Clear Filters</Translate>
          </span>
        </button>
      </ShowIf>
    );
  }
}

ResetSearch.propTypes = {
  connectionsGroups: PropTypes.object,
  resetSearch: PropTypes.func,
};

function mapStateToProps({ relationships }) {
  return {
    connectionsGroups: relationships.list.connectionsGroups,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resetSearch }, dispatch);
}

export { ResetSearch };

export default connect(mapStateToProps, mapDispatchToProps)(ResetSearch);
