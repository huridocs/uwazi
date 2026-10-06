const translatablePropertyTypes = new Set(['text', 'markdown', 'link', 'image', 'media']);

const isTranslatableProperty = (type: string) => translatablePropertyTypes.has(type);

export { isTranslatableProperty };
