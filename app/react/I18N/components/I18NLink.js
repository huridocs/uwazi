import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import objectWithoutKeys from 'app/utils/objectWithoutKeys';

export class I18NLink extends Component {
  render() {
    const props = objectWithoutKeys(this.props, ['dispatch']);
    return <Link {...props}></Link>;
  }
}

export function mapStateToProps({locale}, ownProps) {
  return {to: `/${locale || ''}/${ownProps.to}`.replace(/\/+/g, '/')};
}

export default connect(mapStateToProps)(I18NLink);
