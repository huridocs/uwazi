import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { I18NLink, t } from 'app/I18N';
import { advancedSort } from 'app/utils/advancedSort';
import { Icon } from 'UI';

import { notify } from 'app/Notifications/actions/notificationsActions';

export class TranslationsList extends Component {
  render() {
    const { settings, translations } = this.props;
    const defaultLanguage = settings
      .get('languages')
      .find(lang => lang.get('default'))
      .get('key');
    const defaultTranslation = translations.find(
      translation => translation.get('locale') === defaultLanguage
    );
    const contexts = advancedSort(
      defaultTranslation
        .get('contexts')
        .toJS()
        .map(c => {
          c.sort = c.type + c.label;
          return c;
        }),
      { property: 'sort' }
    );
    return (
      <div className="TranslationsList panel panel-default">
        <div className="panel-heading">{t('System', 'Translations')}</div>
        <ul className="list-group relation-types">
          {contexts.map((context, index) => (
            <li key={index} className="list-group-item">
              <div>
                <span className="item-type item-type-empty">
                  <span className="item-type__name">{context.type}</span>
                </span>
                <I18NLink to={`/settings/translations/edit/${encodeURIComponent(context.id)}`}>
                  {context.label}
                </I18NLink>
              </div>
              <div className="list-group-item-actions">
                <I18NLink
                  to={`/settings/translations/edit/${encodeURIComponent(context.id)}`}
                  className="btn btn-default btn-xs"
                >
                  <Icon icon="language" /> {t('System', 'Translate')}
                </I18NLink>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

TranslationsList.propTypes = {
  translations: PropTypes.object,
  settings: PropTypes.object,
  notify: PropTypes.func,
};

export function mapStateToProps(state) {
  return {
    translations: state.translations,
    settings: state.settings.collection,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ notify }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TranslationsList);
