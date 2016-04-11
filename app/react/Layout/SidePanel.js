import React, {Component, PropTypes} from 'react';
import './scss/sidepanel.scss';

export class SidePanel extends Component {
  render() {
    return (
      <aside className={'side-panel ' + (this.props.open ? 'is-active' : 'is-hidden')}>
        {this.props.children}
      </aside>
    );
  }
}

SidePanel.propTypes = {
  children: PropTypes.oneOfType([
    React.PropTypes.object,
    React.PropTypes.array
  ]),
  open: PropTypes.bool
};

export default SidePanel;
