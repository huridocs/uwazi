import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';

export class SiteName extends Component {
  render() {
    return <Link to="/">{this.props.siteName}</Link>;
  }
}

SiteName.propTypes = {
  siteName: PropTypes.string
};

export function mapStateToProps(state) {
  return {siteName: state.settings.toJS().site_name};
}

export default connect(mapStateToProps)(SiteName);
