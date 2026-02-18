import React, { Component } from 'react';
import { Icon } from '#UI/Icon/Icon.js';
import { t } from '#app/I18N/index.js';
import { ModalTips } from '#app/App/ModalTips.js';
import { SearchTipsContent } from '#app/App/SearchTipsContent.js';

export class SearchInput extends Component {
  render() {
    return (
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          placeholder={t('System', 'Search', null, false)}
          {...this.props}
        />
        <Icon icon="search" />
        <ModalTips
          label={t('System', 'Search Tips', null, false)}
          title={t('System', 'Narrow down your searches', null, false)}
        >
          <SearchTipsContent />
        </ModalTips>
      </div>
    );
  }
}
