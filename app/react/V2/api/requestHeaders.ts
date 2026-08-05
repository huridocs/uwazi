import type { IncomingHttpHeaders } from 'http';

const requestHeaders = (headers?: IncomingHttpHeaders): Record<string, string> | undefined => {
  const mapped = Object.fromEntries(
    Object.entries(headers ?? {}).filter((entry): entry is [string, string] => {
      const [, value] = entry;
      return typeof value === 'string';
    })
  );
  return Object.keys(mapped).length > 0 ? mapped : undefined;
};

export { requestHeaders };
