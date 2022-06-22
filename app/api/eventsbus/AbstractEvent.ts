abstract class AbstractEvent<T> {
  private data: T;

  constructor(data: T) {
    this.data = data;
  }

  getData() {
    return this.data;
  }

  getName() {
    return this.constructor.name;
  }
}

export { AbstractEvent };
