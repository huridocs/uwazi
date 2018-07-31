import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { I18NLink, t } from 'app/I18N';
import { deleteThesauri, checkThesauriCanBeDeleted } from 'app/Thesauris/actions/thesaurisActions';
import { Icon } from 'UI';

import { notify } from 'app/Notifications/actions/notificationsActions';

import sortThesauri from '../utils/sortThesauri';

export class ThesaurisList extends Component {
  deleteThesauri(thesauri) {
    return this.props.checkThesauriCanBeDeleted(thesauri)
    .then(() => {
      this.context.confirm({
        accept: () => {
          this.props.deleteThesauri(thesauri);
        },
        title: `Confirm delete thesaurus: ${thesauri.name}`,
        message: 'Are you sure you want to delete this thesaurus?'
      });
    })
    .catch(() => {
      this.context.confirm({
        accept: () => {},
        noCancel: true,
        title: `Cannot delete thesaurus: ${thesauri.name}`,
        message: 'This thesaurus is being used in document types and cannot be deleted.'
      });
    });
  }

  render() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Thesauri')}</div>
        <ul className="list-group">
          {sortThesauri(this.props.dictionaries.toJS()).map((dictionary, index) => (
            <li key={index} className="list-group-item">
              <I18NLink to={`/settings/dictionaries/edit/${dictionary._id}`}>{dictionary.name}</I18NLink>
              <div className="list-group-item-actions">
                <I18NLink to={`/settings/dictionaries/edit/${dictionary._id}`} className="btn btn-default btn-xs">
                  <Icon icon="pencil-alt" />&nbsp;
                  <span>{t('System', 'Edit')}</span>
                </I18NLink>
                <a onClick={this.deleteThesauri.bind(this, dictionary)} className="btn btn-danger btn-xs template-remove">
                  <Icon icon="trash-alt" />&nbsp;
                  <span>{t('System', 'Delete')}</span>
                </a>
              </div>
            </li>))}
        </ul>
        <div className="settings-footer">
          <I18NLink to="/settings/dictionaries/new" className="btn btn-success">
            <Icon icon="plus" />
            <span className="btn-label">{t('System', 'Add thesaurus')}</span>
          </I18NLink>
        </div>
      </div>);
  }
}

ThesaurisList.propTypes = {
  dictionaries: PropTypes.object,
  deleteThesauri: PropTypes.func,
  notify: PropTypes.func,
  checkThesauriCanBeDeleted: PropTypes.func
};

ThesaurisList.contextTypes = {
  confirm: PropTypes.func
};

export function mapStateToProps(state) {
  return { dictionaries: state.dictionaries };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ notify, deleteThesauri, checkThesauriCanBeDeleted }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ThesaurisList);
