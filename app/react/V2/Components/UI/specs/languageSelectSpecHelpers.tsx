import React from 'react';
import { Provider, createStore } from 'jotai';
import { render } from '@testing-library/react';
import { LanguageSelect } from '../LanguageSelect.js';

const focusDetachedInput = () => {
  const outside = document.createElement('input');
  document.body.appendChild(outside);
  outside.focus();
  return outside;
};

const renderScrollList = (onChange: (value: string) => void) => {
  const manyOptions = Array.from({ length: 40 }, (_, index) => ({
    value: `lang-${index}`,
    label: index === 35 ? 'Zebra' : `Language ${String(index).padStart(2, '0')}`,
  }));
  render(
    <Provider store={createStore()}>
      <LanguageSelect
        value="lang-0"
        options={manyOptions}
        onChange={onChange}
        aria-label="Language"
      />
    </Provider>
  );
};

const installScrollIntoView = () => {
  const scrollIntoView = jest.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
  return scrollIntoView;
};

export { focusDetachedInput, renderScrollList, installScrollIntoView };
