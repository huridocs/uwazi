import type { FieldErrors } from 'react-hook-form';
import { scrollIntoView } from '#V2/helpers/scrollIntoView.js';
import type { EditEntityFormValues } from './buildEditEntityDefaultValues.js';

const isLeafFieldError = (value: object): boolean =>
  'ref' in value || 'message' in value || 'type' in value;

const findFirstErrorPathInRecord = (
  errors: Record<string, unknown>,
  currentPath = ''
): string | undefined => {
  for (const [key, value] of Object.entries(errors)) {
    if (value && typeof value === 'object') {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      if (isLeafFieldError(value)) return nextPath;

      const nestedPath = findFirstErrorPathInRecord(
        Object.fromEntries(Object.entries(value)),
        nextPath
      );
      if (nestedPath) return nestedPath;
    }
  }

  return undefined;
};

const findFirstErrorPath = (errors: FieldErrors<EditEntityFormValues>): string | undefined =>
  findFirstErrorPathInRecord(Object.fromEntries(Object.entries(errors)));

const escapeCssAttributeValue = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const resolveInvalidFieldElement = (path: string): HTMLElement | null => {
  const escapedPath = escapeCssAttributeValue(path);
  return (
    document.getElementById(path) ||
    document.querySelector<HTMLElement>(`[name="${escapedPath}"]`) ||
    document.querySelector<HTMLElement>(`[id^="${escapedPath}"]`)
  );
};

const focusElement = (fieldElement: HTMLElement) => {
  if ('focus' in fieldElement && typeof fieldElement.focus === 'function') {
    fieldElement.focus();
    return;
  }

  fieldElement
    .querySelector<HTMLElement>('input, textarea, button, [tabindex]:not([tabindex="-1"])')
    ?.focus();
};

const flashInvalidFieldHighlight = (fieldElement: HTMLElement) => {
  const { style } = fieldElement;
  const originalTransition = style.transition;
  const originalBoxShadow = style.boxShadow;
  style.transition = 'box-shadow 180ms ease';
  style.boxShadow = '0 0 0 3px var(--color-theme-control-error-ring)';
  window.setTimeout(() => {
    style.boxShadow = originalBoxShadow;
    style.transition = originalTransition;
  }, 900);
};

const focusAndScrollToInvalidField = (path?: string) => {
  if (!path || typeof document === 'undefined') return;

  const fieldElement = resolveInvalidFieldElement(path);
  if (!fieldElement) return;

  scrollIntoView(fieldElement, { behavior: 'smooth', block: 'center' });
  focusElement(fieldElement);
  flashInvalidFieldHighlight(fieldElement);
};

export { escapeCssAttributeValue, findFirstErrorPath, focusAndScrollToInvalidField };
