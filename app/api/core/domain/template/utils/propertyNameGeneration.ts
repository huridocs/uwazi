const safeName = (label: string) =>
  label
    .trim()
    .replace(/[# \\ / | * ? " < > = \s : . [ \] % ! \- & ^ + ( ) { } [ \] ~]/gi, '_')
    .replace(/^[ _ \- + $]/, '')
    .toLowerCase();

export { safeName };
