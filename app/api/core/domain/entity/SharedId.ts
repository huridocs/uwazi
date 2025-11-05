class SharedId {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  static create() {
    return new SharedId(Math.random().toString(36).substr(2));
  }
}

export { SharedId };
