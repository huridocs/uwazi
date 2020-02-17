import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { I18NLink, t } from 'app/I18N';
import { Icon } from 'UI';
import { deletePage } from 'app/Pages/actions/pageActions';

export class PagesList extends Component {
  deletePage(page) {
    return this.context.confirm({
      accept: () => {
        this.props.deletePage(page.toJS());
      },
      title: `Confirm delete page: ${page.get('title')}`,
      message: 'Are you sure you want to delete this page?',
    });
  }

  render() {
    const { pages } = this.props;
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Pages')}</div>
        <ul className="list-group pages">
          {pages.map((page, index) => (
            <li key={index} className="list-group-item">
              <I18NLink to={`/settings/pages/edit/${page.get('sharedId')}`}>
                {page.get('title')}
              </I18NLink>
              <div className="list-group-item-actions">
                <I18NLink
                  to={`/settings/pages/edit/${page.get('sharedId')}`}
                  className="btn btn-default btn-xs"
                >
                  <Icon icon="pencil-alt" /> <span>{t('System', 'Edit')}</span>
                </I18NLink>
                <a
                  onClick={this.deletePage.bind(this, page)}
                  className="btn btn-danger btn-xs template-remove"
                >
                  <Icon icon="trash-alt" /> <span>{t('System', 'Delete')}</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
        <div className="settings-footer">
          <I18NLink to="/settings/pages/new" className="btn btn-success">
            <Icon icon="plus" /> <span className="btn-label">{t('System', 'Add page')}</span>
          </I18NLink>
        </div>
      </div>
    );
  }
}

PagesList.propTypes = {
  pages: PropTypes.object,
  deletePage: PropTypes.func,
};

PagesList.contextTypes = {
  confirm: PropTypes.func,
};

export function mapStateToProps({ pages }) {
  return { pages };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ deletePage }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PagesList);
