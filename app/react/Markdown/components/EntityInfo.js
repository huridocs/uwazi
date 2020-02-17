import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { wrapDispatch } from 'app/Multireducer';
import { getAndSelectDocument as getAndSelectDocumentAction } from 'app/Library/actions/libraryActions';

class EntityInfo extends Component {
  constructor(props) {
    super(props);
    this.getAndSelect = this.getAndSelect.bind(this);
  }

  async getAndSelect(sharedId) {
    const { getAndSelectDocument } = this.props;
    getAndSelectDocument(sharedId);
  }

  render() {
    const { entity, tag, classname, children } = this.props;
    return React.createElement(
      tag,
      { className: classname, onClick: () => this.getAndSelect(entity) },
      children
    );
  }
}

EntityInfo.defaultProps = {
  entity: '',
  tag: 'div',
  children: '',
  classname: '',
};

EntityInfo.propTypes = {
  getAndSelectDocument: PropTypes.func.isRequired,
  entity: PropTypes.string,
  tag: PropTypes.string,
  classname: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]),
};

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    { getAndSelectDocument: getAndSelectDocumentAction },
    wrapDispatch(dispatch, 'library')
  );

export default connect(() => ({}), mapDispatchToProps)(EntityInfo);
