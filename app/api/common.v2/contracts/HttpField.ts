export class HttpField {
  value: string;

  constructor(value: any) {
    this.value = HttpField.parseValue(value);
  }

  private static parseValue(value: any): string {
    if (Array.isArray(value) || typeof value === 'object') {
      return JSON.stringify(value);
    }

    return `${value}`;
  }
}
