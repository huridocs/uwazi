/** Strip common leading indentation so indented API payloads are not parsed as code blocks. */
const normalizeMarkdown = (text: string): string => {
  const lines = text.replace(/^\uFEFF/, '').replace(/\s+$/, '').split('\n');

  while (lines.length > 0 && lines[0].trim().length === 0) {
    lines.shift();
  }

  while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
    lines.pop();
  }

  if (lines.length === 0) {
    return '';
  }

  const nonEmptyIndents = lines
    .filter(line => line.trim().length > 0)
    .map(line => line.match(/^(\s*)/)?.[1].length ?? 0);

  const minIndent = Math.min(...nonEmptyIndents);
  if (minIndent === 0) {
    return lines.join('\n');
  }

  return lines.map(line => (line.trim().length === 0 ? '' : line.slice(minIndent))).join('\n');
};

export { normalizeMarkdown };
