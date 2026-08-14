import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  applyMetadataFieldFocus,
  FLASH_MS,
  focusMetadataFieldAtom,
} from './focusMetadataFieldAtom.js';

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

const useMetadataRecordFocus = (sharedId: string, rootRef: RefObject<HTMLDivElement | null>) => {
  const focusField = useAtomValue(focusMetadataFieldAtom);
  const clearFocus = useSetAtom(focusMetadataFieldAtom);
  const prevSharedIdRef = useRef(sharedId);
  const ownsFocusRef = useRef(false);

  useEffect(() => {
    if (prevSharedIdRef.current !== sharedId) {
      ownsFocusRef.current = false;
      clearFocus(null);
      prevSharedIdRef.current = sharedId;
    }
  }, [sharedId, clearFocus]);

  useEffect(
    () => () => {
      if (ownsFocusRef.current) {
        ownsFocusRef.current = false;
        clearFocus(null);
      }
    },
    [clearFocus]
  );

  useIsomorphicLayoutEffect(() => {
    if (!focusField) return undefined;
    let clearTimer: number | undefined;
    const cleanup = applyMetadataFieldFocus(
      () => rootRef.current,
      focusField.fieldKey,
      () => {
        ownsFocusRef.current = true;
        clearTimer = window.setTimeout(() => {
          ownsFocusRef.current = false;
          clearFocus(null);
        }, FLASH_MS);
      }
    );
    return () => {
      cleanup();
      if (clearTimer !== undefined) window.clearTimeout(clearTimer);
    };
  }, [focusField, clearFocus, rootRef]);
};

export { useMetadataRecordFocus };
