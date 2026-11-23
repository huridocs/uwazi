import React, { ReactNode, useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { Translate, t } from '#app/I18N/index.js';
import { LanguageDropdown } from '#app/V2/Components/UI/Header/LanguageDropdown.js';
import { loginArtFallback, loginArtSrcSet, pickLoginArt, type LoginArt } from './loginArt.js';

const FOOTER_LINKS = [
  { href: 'https://uwazi.io', label: <Translate>uwazi.io</Translate> },
  {
    href: 'https://docs.uwazi.io/',
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
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-paper md:flex-row"
    >
      <div
        data-part="art"
        aria-hidden
        className="relative max-h-[16%] min-h-12 w-full flex-[0_1_16%] overflow-hidden bg-paper md:h-auto md:max-h-none md:min-h-0 md:w-1/2 md:flex-none lg:w-[56%]"
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
      <div data-part="panel" className="flex min-h-0 w-full flex-1 flex-col md:w-auto">
        <div className="login-panel-header flex min-h-13 shrink-0 items-center justify-between px-3">
          <I18NLink
            to="/"
            aria-label={t('System', 'Back', null, false)}
            className="cursor-pointer text-black dark:text-white"
          >
            <ArrowLeftIcon className="h-5 w-5 rtl:rotate-180" aria-hidden />
          </I18NLink>
          <LanguageDropdown appearance="default" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5">
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
    </div>
  );
};

export { AuthLayout };
export { INPUT, LABEL, TEXT_LINK, inputClass, showsControlError } from './authStyles.js';
export { AuthCopy, noticeMessage } from './AuthCopy.js';
export type { AuthMessageValue, AuthTone, CopyCode } from './AuthCopy.js';
export { AuthHeading } from './AuthHeading.js';
export { AuthMessage } from './AuthMessage.js';
export { AuthPasswordField } from './AuthPasswordField.js';
export { AuthSubmit } from './AuthSubmit.js';
