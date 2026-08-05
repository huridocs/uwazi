import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { BertIconStacked } from './BertIcon.js';

const BertWelcome = () => (
  <div className="flex h-full min-h-full flex-col items-center justify-center gap-2.5 py-6 text-center">
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warm">
      <BertIconStacked squareSize={10} gap={3} />
    </div>
    <p className="text-sm font-semibold text-ink">
      <Translate>Hi, I&apos;m Bert.</Translate>
    </p>
    <p className="max-w-[19rem] text-xs leading-relaxed text-ink-muted">
      <Translate>
        A friendly hand for serious work — I&apos;ll act in the context shown above.
      </Translate>
    </p>
  </div>
);

export { BertWelcome };
