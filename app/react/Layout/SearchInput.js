import React, { Component } from 'react';
import { Icon } from 'UI';
import { t } from 'app/I18N';
import ModalTips from 'app/App/ModalTips';
import { SearchTipsContent } from 'app/App/SearchTipsContent';

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

export default SearchInput;
