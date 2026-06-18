import React from 'react';

interface PlainTextProps {
  text: string;
  className?: string;
  dir?: 'ltr' | 'rtl';
}

export const PlainText = ({ className = '', dir, text }: PlainTextProps) => (
  <div className={`${className} whitespace-pre-line`} dir={dir}>
    {text}
  </div>
);

export type { PlainTextProps };
