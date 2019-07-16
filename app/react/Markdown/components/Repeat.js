import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { List } from 'immutable';
import PagesContext from './Context';

class Repeat extends Component {
  renderChildren() {
    const { children } = this.props;
    return Array.isArray(children) ? children.map((child, index) => React.cloneElement(child, { key: index })) : React.cloneElement(children);
  }

  render() {
    const { data } = this.props;
    return (
      <React.Fragment>
        {data.map((item, index) => (
          <PagesContext.Provider value={item} key={index}>
            {this.renderChildren()}
          </PagesContext.Provider>
          ))}
      </React.Fragment>
    );
  }
}

Repeat.defaultProps = {
  data: []
};

Repeat.propTypes = {
  data: PropTypes.oneOfType([PropTypes.array, PropTypes.instanceOf(List)]),
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
};

export default Repeat;
