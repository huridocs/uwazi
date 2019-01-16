import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import SidePanel from 'app/Layout/SidePanel';

export class SemanticSearchSidePanel extends Component {
  render() {
    return (
      <SidePanel open={this.props.open} className="metadata-sidepanel">
        <div>Semantic Search</div>
      </SidePanel>
    );
  }
}

SemanticSearchSidePanel.propTypes = {
  open: PropTypes.bool
};

SemanticSearchSidePanel.defaultProps = {
  open: false
};

export default connect()(SemanticSearchSidePanel);
