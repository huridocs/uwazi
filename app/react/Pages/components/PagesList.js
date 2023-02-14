import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Icon } from 'UI';
import { withContext } from 'app/componentWrappers';
import { I18NLink, t, Translate } from 'app/I18N';
import { SettingsHeader } from 'app/Settings/components/SettingsHeader';
import { deletePage } from 'app/Pages/actions/pageActions';

class PagesList extends Component {
  deletePage(page) {
    return this.props.mainContext.confirm({
      accept: () => {
        this.props.deletePage(page.toJS());
      },
      title: (
        <>
          <Translate>Confirm deletion of page:</Translate>
          &nbsp;{page.get('title')}
        </>
      ),
      message: 'Are you sure you want to delete this page?',
    });
  }

  render() {
    const { pages } = this.props;
    return (
      <div className="panel panel-default">
        <SettingsHeader>
          <Translate>Pages</Translate>
        </SettingsHeader>
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
                  <Icon icon="trash-alt" /> <Translate>Delete</Translate>
                </a>
              </div>
            </li>
          ))}
        </ul>
        <div className="settings-footer">
          <I18NLink to="/settings/pages/new" className="btn btn-default">
            <Icon icon="plus" />{' '}
            <span className="btn-label">
              <Translate>Add page</Translate>
            </span>
          </I18NLink>
        </div>
      </div>
    );
  }
}

PagesList.propTypes = {
  pages: PropTypes.object,
  deletePage: PropTypes.func,
  mainContext: PropTypes.shape({
    confirm: PropTypes.func,
  }).isRequired,
};

export function mapStateToProps({ pages }) {
  return { pages };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ deletePage }, dispatch);
}

export { PagesList };
export default connect(mapStateToProps, mapDispatchToProps)(withContext(PagesList));
