/**
 * A module imported on first use. Routes hold their controller this way: controllers load the
 * backend, which --help, --schema and invalid input never need.
 */
class LazyModule<T> {
  private loaded?: Promise<T>;

  constructor(private readonly load: () => Promise<T>) {}

  async get(): Promise<T> {
    this.loaded ??= this.load();
    return this.loaded;
  }
}

export { LazyModule };
