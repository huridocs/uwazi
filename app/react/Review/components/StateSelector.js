/** @format */

import { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

/*
StateSelector allows making sub-components state-dependent without
adding that state to the parent's props, thus reducing the re-rendering of
the parent.

Usage:
class Parent extends Component {
  render() {
    return (
      <div>
        <Static Parts ... />
        <StateSelector myVal={createSelector(state => state.path.to.obj, value => value)}>
          {({ myVal }) => (<Dynamic Parts propVal={myVal} ... />)}
        </StateSelector>
        <More Static Parts ... />
      </div>
    );
  }
}
*/
export class StateSelectorBase extends Component {
  render() {
    return this.props.children(this.props);
  }
}

StateSelectorBase.defaultProps = {
  isPristine: undefined,
};

StateSelectorBase.propTypes = {
  children: PropTypes.func.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  isPristine: PropTypes.bool,
};

export const StateSelector = connect((state, ownProps) =>
  Object.keys(ownProps)
    .filter(k => !['children'].includes(k))
    .reduce((res, k) => ({ ...res, [k]: ownProps[k](state) }), {})
)(StateSelectorBase);
