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

const MARKDOWN_CONTENT_CLASSNAME = [
  'text-sm leading-relaxed text-ink',
  '[&>*+*]:mt-2',
  '[&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-1',
  '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1',
  '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1',
  '[&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-2 [&_h4]:mb-1',
  '[&_ul]:list-disc [&_ul]:pl-5',
  '[&_ol]:list-decimal [&_ol]:pl-5',
  '[&_li+li]:mt-1',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-ink-secondary',
  '[&_code]:rounded [&_code]:bg-vellum [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs',
  '[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border [&_pre]:bg-vellum [&_pre]:px-3 [&_pre]:py-2',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_table]:w-full [&_table]:border-collapse [&_table]:text-xs',
  '[&_th]:border [&_th]:border-border [&_th]:bg-vellum [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-medium',
  '[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:text-left',
  '[&_a]:text-emphasis [&_a]:underline [&_a]:underline-offset-2',
].join(' ');

export { MARKDOWN_CONTENT_CLASSNAME, normalizeMarkdown };
