import React, {Component, PropTypes} from 'react';
import './scss/sidepanel.scss';

export class SidePanel extends Component {
  render() {
    let propsClass = this.props.className || ''
    return (
      <aside className={'col-xs-10 col-sm-4 col-md-3 side-panel ' + propsClass + ' ' + (this.props.open ? 'is-active' : 'is-hidden')}>
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
