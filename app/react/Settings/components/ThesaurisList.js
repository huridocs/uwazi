/** @format */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { I18NLink, t } from 'app/I18N';
import {
  checkThesaurusCanBeDeleted,
  checkThesaurusCanBeClassified,
  deleteThesaurus,
  disableClassification,
  enableClassification,
} from 'app/Thesauris/actions/thesaurisActions';
import { Icon } from 'UI';

import { notificationActions } from 'app/Notifications';

import sortThesauri from '../utils/sortThesauri';

export class ThesaurisList extends Component {
  getThesaurusSuggestionActions(thesaurus) {
    if (!thesaurus.enable_classification && thesaurus.model_available) {
      return (
        <button
          onClick={this.enableClassification.bind(this, thesaurus)}
          className="btn btn-success btn-xs"
          type="button"
        >
          <Icon icon="toggle-on" />
          &nbsp;
          <span>{t('System', 'Enable')}</span>
        </button>
      );
    }
    if (thesaurus.enable_classification) {
      const view = (
        <div className="thesauri-list vertical-line">
          <span className="thesaurus-suggestion-count">
            {thesaurus.suggestions ? thesaurus.suggestions : 'No'}&nbsp;
            {t('System', 'documents to be reviewed')}
          </span>
          <I18NLink
            to={`/settings/dictionaries/cockpit/${thesaurus._id}`}
            className="btn btn-primary btn-xs"
          >
            <Icon icon="search" />
            &nbsp;
            <span>{t('System', 'View Suggestions')}</span>
          </I18NLink>
        </div>
      );
      return view;
    }
    return null;
  }

  getThesaurusModifyActions(thesaurus) {
    return (
      <div>
        <I18NLink
          to={`/settings/dictionaries/edit/${thesaurus._id}`}
          className="btn btn-default btn-xs"
        >
          <Icon icon="pencil-alt" />
          &nbsp;
          <span>{t('System', 'Edit')}</span>
        </I18NLink>
        {'  '}
        <button
          onClick={this.deleteThesaurus.bind(this, thesaurus)}
          className="btn btn-danger btn-xs template-remove"
          type="button"
        >
          <Icon icon="trash-alt" />
          &nbsp;
          <span>{t('System', 'Delete')}</span>
        </button>
      </div>
    );
  }

  deleteThesaurus(thesaurus) {
    return this.props
      .checkThesaurusCanBeDeleted(thesaurus)
      .then(() => {
        this.context.confirm({
          accept: () => {
            this.props.deleteThesaurus(thesaurus);
          },
          title: `Confirm delete thesaurus: ${thesaurus.name}`,
          message: 'Are you sure you want to delete this thesaurus?',
        });
      })
      .catch(() => {
        this.context.confirm({
          accept: () => {},
          noCancel: true,
          title: `Cannot delete thesaurus: ${thesaurus.name}`,
          message: 'This thesaurus is being used in document types and cannot be deleted.',
        });
      });
  }

  async disableClassification(thesaurus) {
    this.props.disableClassification(thesaurus).catch(() => {
      this.context.confirm({
        accept: () => {},
        noCancel: true,
        title: `Cannot disable classification for thesaurus: ${thesaurus.name}`,
        message: 'Unable to disable classification.',
      });
    });
  }

  async enableClassification(thesaurus) {
    try {
      const canBeEnabled = await this.props.checkThesaurusCanBeClassified(thesaurus);
      if (canBeEnabled) {
        this.props.enableClassification(thesaurus);
      }
    } catch (error) {
      this.context.confirm({
        accept: () => {},
        noCancel: true,
        title: `Cannot enable classification for thesaurus: ${thesaurus.name}`,
        message: 'This thesaurus does not have its topic classification models in a good state.',
      });
    }
  }

  thesaurusNode(thesaurus) {
    return (
      <tr key={thesaurus.name}>
        <th scope="row">
          <I18NLink to={`/settings/dictionaries/edit/${thesaurus._id}`}>{thesaurus.name}</I18NLink>
        </th>
        <td>{this.getThesaurusSuggestionActions(thesaurus)}</td>
        <td>{this.getThesaurusModifyActions(thesaurus)}</td>
      </tr>
    );
  }

  render() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Thesauri')}</div>
        <div className="thesauri-list">
          <table>
            <thead>
              <tr>
                <th className="nameCol" scope="col" />
                <th scope="col" />
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {sortThesauri(this.props.dictionaries.toJS()).map(thesaurus =>
                this.thesaurusNode(thesaurus)
              )}
            </tbody>
          </table>
        </div>
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
  deleteThesaurus: PropTypes.func,
  disableClassification: PropTypes.func,
  enableClassification: PropTypes.func,
  checkThesaurusCanBeClassified: PropTypes.func,
  notify: PropTypes.func,
  checkThesaurusCanBeDeleted: PropTypes.func,
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
      deleteThesaurus,
      checkThesaurusCanBeDeleted,
      disableClassification,
      enableClassification,
      checkThesaurusCanBeClassified,
    },
    dispatch
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ThesaurisList);
