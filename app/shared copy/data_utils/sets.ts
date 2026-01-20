type InitValues<T> = Record<string, T[]>;

class Sets<T> {
  sets: { [key: string]: Set<T> };

  constructor(values?: InitValues<T>) {
    this.sets = {};
    if (values) {
      Object.keys(values).forEach(key => {
        this.add(key);
        values[key].forEach(value => {
          this.add(key, value);
        });
      });
    }
  }

  add(
    value1: string,
    value2?: T
  ): {
    indexWasNew: boolean;
    valueWasNew: boolean;
  } {
    let indexWasNew = false;
    let valueWasNew = false;
    if (!this.sets[value1]) {
      indexWasNew = true;
      this.sets[value1] = new Set();
    }
    const set = this.sets[value1];
    if (value2 && !set.has(value2)) {
      valueWasNew = true;
      set.add(value2);
    }
    return { indexWasNew, valueWasNew };
  }

  has(value1: string, value2?: T): boolean {
    if (!this.sets[value1]) return false;
    if (value2) return this.sets[value1].has(value2);
    return true;
  }

  set(key: string): Set<T> | undefined {
    return this.sets[key];
  }

  setCount(): number {
    return Object.keys(this.sets).length;
  }

  size(): number;

  size(key: string): number | undefined;

  size(key?: string): number | undefined {
    if (key) {
      return this.sets[key] ? this.sets[key].size : undefined;
    }
    return Object.values(this.sets).reduce((acc, set) => acc + set.size, 0);
  }
}

export { Sets };
