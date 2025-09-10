class PropertyName {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  static fromLabel(label: string) {
    const formatted = label
      .trim()
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();

    return new PropertyName(formatted);
  }
}

export { PropertyName };
