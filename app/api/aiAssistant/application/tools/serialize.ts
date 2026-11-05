const toJsonSafe = (value: unknown): unknown => {
  if (value === undefined) {
    return null;
  }

  if (typeof value === 'object' && value !== null && 'asDTO' in value) {
    return toJsonSafe((value as { asDTO: unknown }).asDTO);
  }

  return JSON.parse(
    JSON.stringify(value, (_key, current) => {
      if (current && typeof current === 'object') {
        if (typeof (current as { toHexString?: () => string }).toHexString === 'function') {
          return (current as { toHexString: () => string }).toHexString();
        }
        if (typeof (current as { toJSON?: () => unknown }).toJSON === 'function') {
          return (current as { toJSON: () => unknown }).toJSON();
        }
      }
      return current;
    })
  );
};

const truncateText = (text: string, maxChars: number): string => {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n\n[truncated ${text.length - maxChars} characters]`;
};

export { toJsonSafe, truncateText };
