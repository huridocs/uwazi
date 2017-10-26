import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {switchView as switchViewAction} from '../actions/actions';

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
    const {view} = this.props;
    return (
      <div className="search-list-actions">
        <button onClick={this.switchView('list')} className={`btn ${view !== 'graph' ? 'btn-success' : 'btn-default'}`}>
          <i className="fa fa-th"></i>
        </button>
        <button onClick={this.switchView('graph')} className={`btn ${view === 'graph' ? 'btn-success' : 'btn-default'}`}>
          <i className="fa fa-sitemap fa-rotate-270"></i>
        </button>
      </div>
    );
  }
}

ToggleStyleButtons.propTypes = {
  view: PropTypes.string,
  switchView: PropTypes.func
};

export function mapStateToProps({connectionsList}) {
  return {
    view: connectionsList.view
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    switchView: switchViewAction
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ToggleStyleButtons);
