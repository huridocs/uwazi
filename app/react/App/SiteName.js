import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { I18NLink } from 'app/I18N';
import { actions } from 'app/BasicReducer';
import { store } from '../store';

export class SiteName extends Component {
  render() {
    return (
      <div>
        <Helmet
          titleTemplate={`%s • ${this.props.siteName}`}
          meta={[{ 'char-set': 'utf-8' }, { name: 'description', content: 'Uwazi docs' }]}
        />
        <I18NLink
          to="/"
          onClick={() => store.dispatch(actions.set('library.sidepanel.view', 'library'))}
        >
          {this.props.siteName}
        </I18NLink>
      </div>
    );
  }
}

SiteName.propTypes = {
  siteName: PropTypes.string,
};

export function mapStateToProps(state) {
  return { siteName: state.settings.collection.get('site_name') };
}

export default connect(mapStateToProps)(SiteName);
