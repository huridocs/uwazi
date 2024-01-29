type InitValues<T> = Record<string, T[]>;

class Sets<T> {
  private _sets: { [key: string]: Set<T> };

  constructor(values?: InitValues<T>) {
    this._sets = {};
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
    if (!this._sets[value1]) {
      indexWasNew = true;
      this._sets[value1] = new Set();
    }
    const set = this._sets[value1];
    if (value2 && !set.has(value2)) {
      valueWasNew = true;
      set.add(value2);
    }
    return { indexWasNew, valueWasNew };
  }

  has(value1: string, value2?: T): boolean {
    if (!this._sets[value1]) return false;
    if (value2) return this._sets[value1].has(value2);
    return true;
  }

  get sets(): { [key: string]: Set<T> } {
    return this._sets;
  }

  set(key: string): Set<T> | undefined {
    return this._sets[key];
  }
}

export { Sets };
