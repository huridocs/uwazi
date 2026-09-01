import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  type SetStateAction,
} from 'react';

type ListboxOption<T extends string> = {
  value: T;
  label: string;
};

const PREFIX_RESET_MS = 500;

const findPrefixMatchIndex = <T extends string>(
  options: readonly ListboxOption<T>[],
  prefix: string
): number => {
  const needle = prefix.toLocaleLowerCase();
  return options.findIndex(option => option.label.toLocaleLowerCase().startsWith(needle));
};

const isTypeAheadKey = (event: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}) =>
  event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey;

type ListboxKeyHandlers = {
  close: () => void;
  move: (delta: number) => void;
  select: () => void;
  jump: (index: number) => void;
  typeAhead: (key: string) => void;
};

const dispatchListboxKey = (
  event: KeyboardEvent,
  optionCount: number,
  handlers: ListboxKeyHandlers
) => {
  const actions: Record<string, () => void> = {
    Escape: handlers.close,
    ArrowDown: () => handlers.move(1),
    ArrowUp: () => handlers.move(-1),
    Enter: handlers.select,
    ' ': handlers.select,
    Home: () => handlers.jump(0),
    End: () => handlers.jump(Math.max(optionCount - 1, 0)),
  };
  const action = actions[event.key];
  if (action) {
    event.preventDefault();
    event.stopPropagation();
    action();
    return;
  }
  if (isTypeAheadKey(event)) {
    event.preventDefault();
    event.stopPropagation();
    handlers.typeAhead(event.key);
  }
};

const useTypeAheadPrefix = () => {
  const prefixRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPrefix = useCallback(() => {
    prefixRef.current = '';
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPrefix(), [clearPrefix]);

  const appendPrefix = useCallback((character: string, onMatch: (prefix: string) => void) => {
    prefixRef.current += character;
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      prefixRef.current = '';
      timerRef.current = null;
    }, PREFIX_RESET_MS);
    onMatch(prefixRef.current);
  }, []);

  return { clearPrefix, appendPrefix };
};

type UseListboxKeyboardArgs<T extends string> = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  options: readonly ListboxOption<T>[];
  value: T;
  onChange: (next: T) => void;
  disabled: boolean;
};

const useLanguageSelectListbox = <T extends string>({
  open,
  setOpen,
  options,
  value,
  onChange,
  disabled,
}: UseListboxKeyboardArgs<T>) => {
  const selectedIndex = options.findIndex(option => option.value === value);
  const fallbackHighlight = selectedIndex >= 0 ? selectedIndex : 0;
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const { clearPrefix, appendPrefix } = useTypeAheadPrefix();
  const listboxRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLButtonElement | null>(null);
  const highlightedIndexRef = useRef(highlightedIndex);
  highlightedIndexRef.current = highlightedIndex;

  const close = useCallback(() => {
    setOpen(false);
    clearPrefix();
  }, [setOpen, clearPrefix]);

  const closeAndFocusTrigger = useCallback(() => {
    close();
    triggerElementRef.current?.focus();
  }, [close]);

  const openListbox = useCallback(
    (highlightIndex: number) => {
      setHighlightedIndex(highlightIndex);
      setOpen(true);
    },
    [setOpen]
  );

  const selectOption = useCallback(
    (next: T) => {
      onChange(next);
      closeAndFocusTrigger();
    },
    [onChange, closeAndFocusTrigger]
  );

  const onTriggerClick = () => {
    if (disabled) return;
    if (open) close();
    else openListbox(fallbackHighlight);
  };

  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled || open) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openListbox(fallbackHighlight);
      return;
    }
    if (!isTypeAheadKey(event)) return;
    event.preventDefault();
    appendPrefix(event.key, prefix => {
      const matchIndex = findPrefixMatchIndex(options, prefix);
      openListbox(matchIndex >= 0 ? matchIndex : fallbackHighlight);
    });
  };

  useEffect(() => {
    if (!open) {
      clearPrefix();
      return;
    }
    listboxRef.current?.focus();
  }, [open, clearPrefix]);

  useEffect(() => {
    if (!open) return;
    const optionEl = listboxRef.current?.children[highlightedIndex];
    if (optionEl instanceof HTMLElement) {
      optionEl.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightedIndex]);

  const handlersRef = useRef<ListboxKeyHandlers>({
    close: () => undefined,
    move: () => undefined,
    select: () => undefined,
    jump: () => undefined,
    typeAhead: () => undefined,
  });
  handlersRef.current = {
    close: closeAndFocusTrigger,
    move: delta => {
      if (options.length === 0) return;
      clearPrefix();
      setHighlightedIndex(i => (i + delta + options.length) % options.length);
    },
    select: () => {
      const option = options[highlightedIndexRef.current];
      if (!option) return;
      selectOption(option.value);
    },
    jump: index => {
      clearPrefix();
      setHighlightedIndex(index);
    },
    typeAhead: key => {
      appendPrefix(key, prefix => {
        const matchIndex = findPrefixMatchIndex(options, prefix);
        if (matchIndex >= 0) setHighlightedIndex(matchIndex);
      });
    },
  };

  useEffect(() => {
    if (!open || disabled) {
      return undefined;
    }
    const isInsideSelect = (target: EventTarget | null) => {
      if (!(target instanceof Node)) {
        return false;
      }
      return Boolean(
        listboxRef.current?.contains(target) || triggerElementRef.current?.contains(target)
      );
    };
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (!isInsideSelect(event.target)) {
        return;
      }
      dispatchListboxKey(event, options.length, handlersRef.current);
    };
    document.addEventListener('keydown', onDocumentKeyDown, true);
    return () => document.removeEventListener('keydown', onDocumentKeyDown, true);
  }, [open, disabled, options.length]);

  return {
    highlightedIndex,
    listboxRef,
    triggerElementRef,
    onTriggerKeyDown,
    onTriggerClick,
    close,
    selectOption,
  };
};

export { useLanguageSelectListbox };
export type { ListboxOption };
