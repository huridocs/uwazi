class Property {
  readonly type: string;

  readonly name: string;

  readonly label: string;

  readonly template: string;

  constructor(type: string, name: string, label: string, template: string) {
    this.type = type;
    this.name = name;
    this.label = label;
    this.template = template;
  }
}

export { Property };
