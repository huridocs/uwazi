import { Context } from 'api/core/domain/template/Property';

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
