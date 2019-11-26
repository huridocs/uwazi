/** @format */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { I18NLink, t } from 'app/I18N';
import {
  checkThesauriCanBeDeleted,
  checkThesauriCanBeClassified,
  deleteThesauri,
  enableClassification,
} from 'app/Thesauris/actions/thesaurisActions';
import { Icon } from 'UI';

import { notificationActions } from 'app/Notifications';

import sortThesauri from '../utils/sortThesauri';

export class ThesaurisList extends Component {
  deleteThesauri(thesauri) {
    return this.props
      .checkThesauriCanBeDeleted(thesauri)
      .then(() => {
        this.context.confirm({
          accept: () => {
            this.props.deleteThesauri(thesauri);
          },
          title: `Confirm delete thesaurus: ${thesauri.name}`,
          message: 'Are you sure you want to delete this thesaurus?',
        });
      })
      .catch(() => {
        this.context.confirm({
          accept: () => {},
          noCancel: true,
          title: `Cannot delete thesaurus: ${thesauri.name}`,
          message: 'This thesaurus is being used in document types and cannot be deleted.',
        });
      });
  }

  async enableClassification(thesauri) {
     this.props
      .checkThesauriCanBeClassified(thesauri)
      .then(this.props.enableClassification(thesauri))
      .catch(() => {
        this.context.confirm({
          accept: () => {},
          noCancel: true,
          title: `Cannot enable classification for thesaurus: ${thesauri.name}`,
          message: 'This thesaurus does not have its topic classification models in a good state.',
        });
      });
  }

  render() {
    return (
      <div className="panel panel-default">
        <dreturniv className="panel-heading">{t('System', 'Thesauri')}</div>
        <ul className="list-group">
          {sortThesauri(this.props.dictionaries.toJS()).map(thesauri => (
            <li key={thesauri.name} className="list-group-item">
              <I18NLink to={`/settings/dictionaries/edit/${thesauri._id}`}>
                {thesauri.name}
              </I18NLink>
              <div className="list-group-item-actions">
                <I18NLink
                  to={`/settings/dictionaries/edit/${thesauri._id}`}
                  className="btn btn-default btn-xs"
                >
                  <Icon icon="pencil-alt" />
                  &nbsp;
                  <span>{t('System', 'Edit')}</span>
                </I18NLink>
                {thesauri.enable_classification ? (
                  <I18NLink
                    to={`/settings/dictionaries/classify_stats/${thesauri._id}`}
                    className="btn btn-success btn-xs"
                  >
                    <Icon icon="code" />
                    &nbsp;
                    <span>{t('System', 'Review ML')}</span>
                  </I18NLink>
                ) : null}
                <button
                  onClick={this.enableClassification.bind(this, thesauri)}
                  className="btn btn-default btn-xs"
                  type="button"
                >
                  <Icon icon="code" />
                  &nbsp;
                  <span>{t('System', 'Enable ML')}</span>
                </button>
                <button
                  onClick={this.deleteThesauri.bind(this, thesauri)}
                  className="btn btn-danger btn-xs template-remove"
                  type="button"
                >
                  <Icon icon="trash-alt" />
                  &nbsp;
                  <span>{t('System', 'Delete')}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="settings-footer">
          <I18NLink to="/settings/dictionaries/new" className="btn btn-success">
            <Icon icon="plus" />
            <span className="btn-label">{t('System', 'Add thesaurus')}</span>
          </I18NLink>
        </div>
      </div>
    );
  }
}

ThesaurisList.propTypes = {
  dictionaries: PropTypes.object,
  deleteThesauri: PropTypes.func,
  enableClassification: PropTypes.func,
  checkThesauriCanBeClassified: PropTypes.func,
  notify: PropTypes.func,
  checkThesauriCanBeDeleted: PropTypes.func,
};

ThesaurisList.contextTypes = {
  confirm: PropTypes.func,
};

export function mapStateToProps(state) {
  return { dictionaries: state.dictionaries };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      notify: notificationActions.notify,
      deleteThesauri,
      checkThesauriCanBeDeleted,
      enableClassification,
      checkThesauriCanBeClassified,
    },
    dispatch
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ThesaurisList);
