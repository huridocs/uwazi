// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context } from 'api/templates.v2/model/Property.js';

class PropertyName {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  static fromLabel(label: string, context?: Context) {
    return new PropertyName(
      context?.newNameGeneration ? this.newNameGeneration(label) : this.oldNameGeneration(label)
    );
  }

  private static newNameGeneration = (label: string) =>
    label
      .trim()
      .replace(/[#|\\|/|*|?|"|<|>|=|||\s|:|.|[|\]|%]/gi, '_')
      .replace(/^[_|\-|+|$]/, '')
      .toLowerCase();

  private static oldNameGeneration = (label: string) =>
    label
      .trim()
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
}

export { PropertyName };
