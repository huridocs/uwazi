import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Icon } from 'UI';

import { switchView as switchViewAction } from '../actions/actions';

export class ToggleStyleButtons extends Component {
  constructor(props) {
    super(props);
    this.switchView = this.switchView.bind(this);
  }

  switchView(type) {
    return () => {
      this.props.switchView(type);
    };
  }

  render() {
    const { view } = this.props;
    return (
      <div className="search-list-actions">
        <button
          onClick={this.switchView('list')}
          className={`btn ${view !== 'graph' ? 'btn-success' : 'btn-default'}`}
        >
          <Icon icon="th" />
        </button>
        <button
          onClick={this.switchView('graph')}
          className={`btn ${view === 'graph' ? 'btn-success' : 'btn-default'}`}
        >
          <Icon icon="sitemap" transform={{ rotate: 270 }} />
        </button>
      </div>
    );
  }
}

ToggleStyleButtons.propTypes = {
  view: PropTypes.string,
  switchView: PropTypes.func,
};

export function mapStateToProps({ connectionsList }) {
  return {
    view: connectionsList.view,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      switchView: switchViewAction,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(ToggleStyleButtons);
