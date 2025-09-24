// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
import { Template } from '../../apiResponseTypes.js';

const filterPXQualifiedTemplates = (template: Template) =>
  // @ts-expect-error TS(7031): Binding element 'type' implicitly has an 'any' typ... Remove this comment to see the full error message
  template.properties?.some(({ type }) => type === 'markdown') &&
  // @ts-expect-error TS(7031): Binding element 'type' implicitly has an 'any' typ... Remove this comment to see the full error message
  template.properties?.some(({ type }) => type === 'numeric');

export { filterPXQualifiedTemplates };
