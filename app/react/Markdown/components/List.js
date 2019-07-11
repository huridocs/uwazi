import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { PagesContext } from './Context';

class List extends Component {
  render() {
    const { children, data } = this.props;
    return (
      <React.Fragment>
        {data.map((item, index) => (
          <PagesContext.Provider value={item} key={index}>
            {React.cloneElement(children[0])}
          </PagesContext.Provider>
          ))}
      </React.Fragment>
    );
  }
}

List.defaultProps = {
  data: ['Batman', 'Robin'],
};

List.propTypes = {
  data: PropTypes.array,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
};

export default List;
