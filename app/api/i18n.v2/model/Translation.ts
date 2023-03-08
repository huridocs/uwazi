export class Translation {
  readonly _id: string;

  readonly key: string;

  readonly value: string;

  readonly language: string;

  readonly context: { type: string; label: string; id: string };

  constructor(
    _id: string,
    key: string,
    value: string,
    language: string,
    context: { type: string; label: string; id: string }
  ) {
    this._id = _id;
    this.key = key;
    this.value = value;
    this.language = language;
    this.context = context;
  }
}
