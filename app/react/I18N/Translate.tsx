import React, { Fragment, ReactNode } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { translationsAtom, inlineEditAtom, localeAtom } from '#V2/atoms/index.js';
import { Truncate } from '#V2/Components/UI/Truncate.js';
import type { ClientTranslationContextSchema } from '#app/istore.js';

const parseMarkdownMarker = (
  line: string,
  regexp: RegExp,
  wrapper: (text: string) => ReactNode
): ReactNode | null => {
  const globalRegexp = new RegExp(regexp.source, 'g');
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match = globalRegexp.exec(line);
  if (!match) return null;

  while (match) {
    if (match.index > lastIndex) nodes.push(line.slice(lastIndex, match.index));
    nodes.push(wrapper(match[1]));
    lastIndex = globalRegexp.lastIndex;
    match = globalRegexp.exec(line);
  }
  if (lastIndex < line.length) nodes.push(line.slice(lastIndex));
  return nodes.map((node, index) => <Fragment key={index}>{node}</Fragment>);
};

const parseMarkdownBoldMarker = (line: string) =>
  parseMarkdownMarker(line, /\*{2}(.+?)\*{2}/, text => <strong>{text}</strong>);

const parseMarkdownItalicMarker = (line: string) =>
  parseMarkdownMarker(line, /\*(.+?)\*/, text => <i>{text}</i>);

type TranslateProps = {
  className?: string;
  children?: string;
  context?: string;
  translationKey?: string;
  truncate?: number;
};

const Translate = ({
  className,
  children,
  context = 'System',
  translationKey,
  truncate,
}: TranslateProps) => {
  const translations = useAtomValue(translationsAtom);
  const locale = useAtomValue(localeAtom);
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);

  const language = (translations ?? []).find(
    (translation: { locale: string }) => translation.locale === locale
  );
  const activeClassName = inlineEditState.inlineEdit ? 'translation active' : 'translation';

  const translationContext = language?.contexts.find(
    (ctx: ClientTranslationContextSchema) => ctx.id === context
  ) || { values: {} };
  const text = translationContext.values[(translationKey || children)!] || children;
  const lines = text ? text.split('\n') : [];

  const renderText = () =>
    lines.map((line: string, index: number) => {
      const boldMatches = parseMarkdownBoldMarker(line);
      const italicMatches = parseMarkdownItalicMarker(line);
      return (
        <Fragment key={`${line}-${index.toString()}`}>
          {boldMatches || italicMatches || <>{line}</>}
          {index < lines.length - 1 && <br />}
        </Fragment>
      );
    });

  const renderTruncatedText = () => <Truncate maxLength={truncate}>{renderText()}</Truncate>;

  return (
    <span
      onClick={event => {
        if (inlineEditState.inlineEdit) {
          event.stopPropagation();
          event.preventDefault();
          setInlineEditState({
            inlineEdit: inlineEditState.inlineEdit,
            context,
            translationKey: (translationKey || children)!,
          });
        }
      }}
      className={`${activeClassName} ${className || ''}`}
    >
      {truncate ? renderTruncatedText() : renderText()}
    </span>
  );
};

export { Translate };
