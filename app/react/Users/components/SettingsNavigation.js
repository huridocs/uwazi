import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {actions} from 'app/BasicReducer';

export class SettingsNavigation extends Component {

  handleClick(section) {
    this.props.setSection(section);
  }

  render() {
    return <div className="panel panel-default">
      <div className="panel-heading">Settings</div>
      <div className="list-group">
        <button
          onClick={this.handleClick.bind(this, 'account')}
          className={'list-group-item' + (this.props.section === 'account' ? ' active' : '')}>
          Account
        </button>
        <button
        onClick={this.handleClick.bind(this, 'collection')}
        className={'list-group-item' + (this.props.section === 'collection' ? ' active' : '')}>
          Collection
        </button>
      </div>
    </div>;
  }
}

SettingsNavigation.propTypes = {
  section: PropTypes.string,
  setSection: PropTypes.func
};

export function mapStateToProps(state) {
  return {section: state.users.section};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setSection: actions.set.bind(null, 'users/section')}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsNavigation);
