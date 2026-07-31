import React, { useEffect, useRef } from 'react';

type EntityPageScriptProps = {
  code: string;
  onError?: (error: unknown) => void;
};

/**
 * Runs custom page scripts without Redux. Parent is responsible for injecting
 * `var datasets = ...` (and any store shim) into `code`.
 */
const EntityPageScript = ({ code, onError }: EntityPageScriptProps) => {
  const scriptElement = useRef<HTMLScriptElement | null>(null);
  const renderedCode = useRef<string | null>(null);

  useEffect(() => {
    if (!code || renderedCode.current === code) {
      return undefined;
    }

    const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
      onError?.(event);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    if (scriptElement.current) {
      scriptElement.current.remove();
      scriptElement.current = null;
    }

    const element = document.createElement('script');
    element.src = `data:text/javascript,(function(){${encodeURIComponent(`\n\n${code}\n\n`)}})()`;
    document.body.appendChild(element);
    scriptElement.current = element;
    renderedCode.current = code;

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
      if (scriptElement.current) {
        scriptElement.current.remove();
        scriptElement.current = null;
      }
      renderedCode.current = null;
    };
  }, [code, onError]);

  return null;
};

export { EntityPageScript };
