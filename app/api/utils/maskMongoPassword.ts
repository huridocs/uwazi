export function maskMongoPassword(uri: string): string {
  if (!uri) return uri;

  const slashSlash = uri.indexOf('//');
  const authStart = slashSlash >= 0 ? slashSlash + 2 : 0;

  const cutPoints = [
    uri.indexOf('/', authStart),
    uri.indexOf('?', authStart),
    uri.indexOf('#', authStart),
  ].filter(i => i !== -1);
  const authEnd = cutPoints.length ? Math.min(...cutPoints) : uri.length;

  const atIndex = uri.lastIndexOf('@', authEnd - 1);
  if (atIndex === -1 || atIndex < authStart) return uri;

  const colonIndex = uri.indexOf(':', authStart);
  if (colonIndex === -1 || colonIndex > atIndex - 1) {
    return uri;
  }

  return `${uri.slice(0, colonIndex + 1)}###${uri.slice(atIndex)}`;
}
