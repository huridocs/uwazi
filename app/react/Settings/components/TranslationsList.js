import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {I18NLink, t} from 'app/I18N';

import {notify} from 'app/Notifications/actions/notificationsActions';

export class TranslationsList extends Component {

  render() {
    let {settings, translations} = this.props;
    let defaultLanguage = settings.toJS().languages.find((lang) => lang.default).key;
    let defaultTranslation = translations.toJS().find((translation) => translation.locale === defaultLanguage);
    return <div className="panel panel-default">
      <div className="panel-heading">{t('System', 'Translations')}</div>
      <ul className="list-group relation-types">
        {defaultTranslation.contexts.map((context, index) => {
          return <li key={index} className="list-group-item">
              <I18NLink to={'/settings/translations/edit/' + encodeURIComponent(context.id)}>{context.label}</I18NLink>
              <div className="pull-right">
                <I18NLink to={'/settings/translations/edit/' + encodeURIComponent(context.id)} className="btn btn-default btn-xs">
                  <i className="fa fa-language"></i>
                  <span>{t('System', 'Translate')}</span>
                </I18NLink>
              </div>
            </li>;
        })}
      </ul>
    </div>;
  }
}

TranslationsList.propTypes = {
  translations: PropTypes.object,
  settings: PropTypes.object,
  notify: PropTypes.func
};

export function mapStateToProps(state) {
  return {
    translations: state.translations,
    settings: state.settings.collection
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({notify}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TranslationsList);
