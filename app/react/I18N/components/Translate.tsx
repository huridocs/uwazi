/* eslint-disable max-statements */
import React, { Fragment, ReactNode } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { translationsAtom, inlineEditAtom, localeAtom } from 'V2/atoms';

const parseMarkdownMarker = (
  line: string,
  regexp: RegExp,
  wrapper: (text: string) => ReactNode
) => {
  const matches = line.match(regexp);
  if (matches == null) {
    return matches;
  }
  const parts = matches.input?.split(matches[0]);
  return (
    <>
      {parts?.length && parts[0]}
      {wrapper(matches[1])}
      {parts?.length && parts[1]}
    </>
  );
};

const parseMarkdownBoldMarker = (line: string) =>
  parseMarkdownMarker(line, /\*{2}(.*)\*{2}/, text => <strong>{text}</strong>);

const parseMarkdownItalicMarker = (line: string) =>
  parseMarkdownMarker(line, /\*(.*)\*/, text => <i>{text}</i>);

type TranslateProps = {
  className?: string;
  children?: string;
  context?: string;
  translationKey?: string;
};

const Translate = ({ className, children, context = 'System', translationKey }: TranslateProps) => {
  const translations = useAtomValue(translationsAtom);
  const locale = useAtomValue(localeAtom);
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);

  const language = translations.find(translation => translation.locale === locale);
  const activeClassName = inlineEditState.inlineEdit ? 'translation active' : 'translation';

  const translationContext = language?.contexts.find(ctx => ctx.id === context) || { values: {} };
  const text = translationContext.values[(translationKey || children)!] || children;
  const lines = text ? text.split('\n') : [];

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
      className={`${activeClassName} ${className}`}
    >
      {lines.map((line, index) => {
        const boldMatches = parseMarkdownBoldMarker(line);
        const italicMatches = parseMarkdownItalicMarker(line);
        return (
          <Fragment key={`${line}-${index.toString()}`}>
            {boldMatches ||
              italicMatches || ( // eslint-disable-next-line react/jsx-no-useless-fragment
                <>{line}</>
              )}
            {index < lines.length - 1 && <br />}
          </Fragment>
        );
      })}
    </span>
  );
};

export { Translate };
