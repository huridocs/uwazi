import React, {Component, PropTypes} from 'react';

export class ViewerDefaultMenu extends Component {
  render() {
    return (
      <div className={this.props.active ? 'active' : ''}>
        <div className="float-btn__sec"><span>View metadata</span><i className="fa fa-list-alt"></i></div>
        <div className="float-btn__sec"><span>View relationships</span><i className="fa fa-link"></i></div>
        <div className="float-btn__sec"><span>View comments</span><i className="fa fa-comment"></i></div>
        <div className="float-btn__main"><i className="fa fa-bar-chart"></i></div>
      </div>
    );
  }
}

ViewerDefaultMenu.propTypes = {
  active: PropTypes.bool
};

export default ViewerDefaultMenu;
