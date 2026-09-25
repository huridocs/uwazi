/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider, createStore } from 'jotai';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { isMobileOverrideAtom } from '#V2/atoms/isMobileAtom.js';
import { LanguageSelect } from '../LanguageSelect.js';
import {
  focusDetachedInput,
  installScrollIntoView,
  renderScrollList,
} from './languageSelectSpecHelpers.js';

const options = [
  { value: 'en', label: 'English', iso6391: 'en' },
  { value: 'es', label: 'Español', iso6391: 'es' },
  { value: 'fr', label: 'Français', iso6391: 'fr' },
] as const;

const renderSelect = ({
  isMobile,
  appearance = 'default',
  value = 'en',
}: {
  isMobile?: boolean;
  appearance?: 'default' | 'compact';
  value?: (typeof options)[number]['value'];
} = {}) => {
  const store = createStore();
  if (isMobile !== undefined) {
    store.set(isMobileOverrideAtom, isMobile);
  }
  const onChange = jest.fn();
  render(
    <Provider store={store}>
      <LanguageSelect
        value={value}
        options={options}
        onChange={onChange}
        aria-label="Language"
        appearance={appearance}
      />
    </Provider>
  );
  return { onChange };
};

const openSelect = async (user: ReturnType<typeof userEvent.setup>) => {
  const trigger = screen.getByRole('button', { name: 'Language' });
  await user.click(trigger);
  return trigger;
};

const expectActiveOption = (value: string) => {
  expect(screen.getByRole('listbox')).toHaveAttribute(
    'aria-activedescendant',
    expect.stringContaining(`option-${value}`)
  );
};

describe('LanguageSelect', () => {
  it('shows the translated name on the desktop trigger and in option rows', async () => {
    renderSelect({ isMobile: false });

    expect(screen.getByRole('button', { name: 'Language' })).toHaveTextContent('English');

    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual([
      'English',
      'Español',
      'Français',
    ]);
  });

  it('shows ISO 639-1 on the mobile trigger while options stay name-only', async () => {
    renderSelect({ isMobile: true });

    expect(screen.getByRole('button', { name: 'Language' })).toHaveTextContent('EN');

    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual([
      'English',
      'Español',
      'Français',
    ]);
  });

  it('opens the menu outside an overflow-hidden parent', async () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <div data-testid="clip" className="overflow-hidden">
          <LanguageSelect
            value="en"
            options={options}
            onChange={jest.fn()}
            aria-label="Language"
            appearance="compact"
          />
        </div>
      </Provider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Language' }));

    expect(screen.getByTestId('clip').contains(screen.getByRole('listbox'))).toBe(false);
  });

  it('calls onChange with the selected value and closes', async () => {
    const { onChange } = renderSelect({ isMobile: false });

    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    await userEvent.click(screen.getByRole('option', { name: 'Español' }));

    expect(onChange).toHaveBeenCalledWith('es');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  describe('keyboard navigation and type-ahead', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('moves highlight with arrows and selects with Enter', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { onChange } = renderSelect({ value: 'en' });
      await openSelect(user);
      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith('es');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('selects highlighted option with Space', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { onChange } = renderSelect({ value: 'en' });
      await openSelect(user);
      expect(screen.getByRole('listbox')).toHaveFocus();

      await user.keyboard('{ArrowDown}{ArrowDown}');
      await user.keyboard(' ');

      expect(onChange).toHaveBeenCalledWith('fr');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes on Escape without selecting', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { onChange } = renderSelect({ value: 'en' });
      await openSelect(user);
      expect(screen.getByRole('listbox')).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Escape}');

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('jumps highlight to first label matching accumulated prefix', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { onChange } = renderSelect({ value: 'en' });
      await openSelect(user);
      expect(screen.getByRole('listbox')).toHaveFocus();

      await user.keyboard('f');
      expectActiveOption('fr');
      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith('fr');
    });

    it('accumulates multi-character prefix within the reset window', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { onChange } = renderSelect({ value: 'fr' });
      await openSelect(user);

      await user.keyboard('e');
      expectActiveOption('en');
      await user.keyboard('s');
      expectActiveOption('es');
      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith('es');
    });

    it('resets the type-ahead prefix after 500ms', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderSelect({ value: 'en' });
      await openSelect(user);

      await user.keyboard('e');
      expectActiveOption('en');
      await act(async () => {
        jest.advanceTimersByTime(500);
      });
      await user.keyboard('f');
      expectActiveOption('fr');
    });
  });

  describe('type-ahead from trigger and listbox', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('opens from a closed focused trigger and jumps to matching prefix', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { onChange } = renderSelect({ value: 'en' });
      screen.getByRole('button', { name: 'Language' }).focus();

      await user.keyboard('f');
      expect(screen.getByRole('button', { name: 'Language' })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
      expectActiveOption('fr');
      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith('fr');
    });

    it('accumulates prefix across closed-trigger open into the listbox', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { onChange } = renderSelect({ value: 'fr' });
      screen.getByRole('button', { name: 'Language' }).focus();

      await user.keyboard('e');
      expectActiveOption('en');
      await user.keyboard('s{Enter}');
      expect(onChange).toHaveBeenCalledWith('es');
    });

    it('type-ahead still works when an option is focused', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { onChange } = renderSelect({ value: 'en' });
      await openSelect(user);

      const option = screen.getByRole('option', { name: 'English' });
      option.focus();
      expect(option).toHaveFocus();

      await user.keyboard('f');
      expectActiveOption('fr');
      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith('fr');
    });

    it('ignores keydown when focus is outside the select', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { onChange } = renderSelect({ value: 'en' });
      await openSelect(user);
      expectActiveOption('en');

      const outside = focusDetachedInput();
      await user.keyboard('f{Enter}');
      outside.remove();
      expectActiveOption('en');
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('scrolls the highlighted option into view', async () => {
      const scrollIntoView = installScrollIntoView();
      const onChange = jest.fn();
      renderScrollList(onChange);

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      await openSelect(user);
      scrollIntoView.mockClear();

      await user.keyboard('z');
      expectActiveOption('lang-35');
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
      expect(screen.getByRole('listbox')).toHaveClass('max-h-60', 'overflow-y-auto');
    });
  });
});
