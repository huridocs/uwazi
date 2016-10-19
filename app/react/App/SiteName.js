import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';
import {Link} from 'react-router';

export class SiteName extends Component {
  render() {
    return (
      <div>
        <Helmet
          titleTemplate={`%s • ${this.props.siteName}`}
          meta={[
            {'char-set': 'utf-8'},
            {name: 'description', content: 'Uwazi docs'}
          ]}
        />
        <Link to="/">{this.props.siteName}</Link>
      </div>
    );
  }
}

SiteName.propTypes = {
  siteName: PropTypes.string
};

export function mapStateToProps(state) {
  return {siteName: state.settings.collection.get('site_name')};
}

export default connect(mapStateToProps)(SiteName);
