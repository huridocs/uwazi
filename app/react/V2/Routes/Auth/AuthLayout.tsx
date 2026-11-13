import React, { ReactNode, useEffect, useState } from 'react';
import { Translate, t } from '#app/I18N/index.js';
import { loginArtFallback, loginArtSrcSet, pickLoginArt, type LoginArt } from './loginArt.js';

const FOOTER_LINKS = [
  { href: 'https://uwazi.io', label: <Translate>Website</Translate> },
  {
    href: 'https://uwazi.io/page/9852italrtk/support',
    label: <Translate>Documentation</Translate>,
  },
  { href: 'https://github.com/huridocs/uwazi', label: <Translate>Contribute</Translate> },
];

const AuthLayout = ({ component, children }: { component: string; children: ReactNode }) => {
  const [art, setArt] = useState<LoginArt | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setArt(pickLoginArt());
  }, []);

  return (
    <div
      data-component={component}
      className="flex min-h-dvh flex-col bg-paper md:flex-row md:overflow-hidden"
    >
      <div
        data-part="art"
        aria-hidden
        className="relative h-[35dvh] min-h-48 shrink-0 overflow-hidden bg-paper md:h-auto md:w-1/2 lg:w-[56%]"
      >
        {art && (
          <picture>
            <source
              type="image/avif"
              srcSet={loginArtSrcSet(art, 'avif')}
              sizes="(min-width: 1024px) 56vw, (min-width: 768px) 50vw, 100vw"
            />
            <source
              type="image/webp"
              srcSet={loginArtSrcSet(art, 'webp')}
              sizes="(min-width: 1024px) 56vw, (min-width: 768px) 50vw, 100vw"
            />
            <img
              src={loginArtFallback(art)}
              alt=""
              decoding="async"
              onLoad={() => setLoaded(true)}
              data-art={art.id}
              className={`login-art absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ objectPosition: art.focus }}
            />
          </picture>
        )}
      </div>
      <div data-part="panel" className="flex flex-1 flex-col px-5 md:min-h-0 md:overflow-y-auto">
        <div data-part="body" className="flex flex-1 items-center justify-center py-6">
          <div className="w-full max-w-[22.5rem]">{children}</div>
        </div>
        <footer
          data-part="footer"
          className="flex flex-col items-center gap-2 py-6 text-xs text-ink-tertiary"
        >
          <nav
            aria-label={t('System', 'About Uwazi', null, false)}
            className="flex flex-wrap justify-center gap-x-5 gap-y-1"
          >
            {FOOTER_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </footer>
      </div>
    </div>
  );
};

export { AuthLayout };
export { INPUT, LABEL, TEXT_LINK } from './authStyles.js';
export { AuthCopy, noticeMessage } from './AuthCopy.js';
export type { AuthMessageValue, AuthTone, CopyCode } from './AuthCopy.js';
export { AuthHeading } from './AuthHeading.js';
export { AuthMessage } from './AuthMessage.js';
export { AuthPasswordField } from './AuthPasswordField.js';
export { AuthSubmit } from './AuthSubmit.js';
