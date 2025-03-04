import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { LanguageUtils } from 'shared/language';
import { t } from 'app/I18N';

export class DocumentLanguage extends Component {
  render() {
    const { doc } = this.props;

    if (!doc.get('file')) {
      return null;
    }

    if (doc.get('file')) {
      const fileLanguage = doc.getIn(['file', 'language']);
      if (fileLanguage && fileLanguage !== 'other') {
        if (this.props.locale === LanguageUtils.fromISO639_3(fileLanguage, false)?.ISO639_1) {
          return null;
        }

        return (
          <span className="item-type__documentLanguage">
            <span>{LanguageUtils.fromISO639_3(fileLanguage, false)?.ISO639_1 || fileLanguage}</span>
          </span>
        );
      }

      return (
        <span className="item-type__documentLanguage">
          <span>{t('System', 'Other')}</span>
        </span>
      );
    }
  }
}

DocumentLanguage.propTypes = {
  doc: PropTypes.object,
  locale: PropTypes.string,
};

export const mapStateToProps = ({ locale }) => ({ locale });

export default connect(mapStateToProps)(DocumentLanguage);
