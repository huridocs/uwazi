export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.css') || specifier.endsWith('.scss') || specifier.endsWith('.sass')) {
    const url = new URL(specifier, context.parentURL || 'file:///');
    return {
      shortCircuit: true,
      url: url.href,
    };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  const urlString = url.toString();
  if (urlString.endsWith('.css') || urlString.endsWith('.scss') || urlString.endsWith('.sass')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default {};',
    };
  }
  if (nextLoad) {
    return nextLoad(url, context);
  }
  throw new Error(`Cannot load ${url}`);
}
