import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {connect} from 'react-redux';

export class I18N extends Component {
  render() {
    let dictionary = this.props.dictionaries.toJS().find((d) => d.locale === this.props.locale) || {values: {}};
    let text = this.props.children;
    text = dictionary.values[text] || text;
    return <span>{text}</span>;
  }
}

I18N.propTypes = {
  children: PropTypes.string,
  locale: PropTypes.string,
  dictionaries: PropTypes.object
};

const mapStateToProps = ({locale, dictionaries}) => {
  return {locale, dictionaries};
};

export default connect(mapStateToProps)(I18N);
