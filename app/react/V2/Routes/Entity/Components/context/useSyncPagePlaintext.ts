import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import type { FileType } from '#V2/api/entities/types.js';
import { PAGE_PARAM, VIEW_MODE_PARAM } from '../../urlParams.js';
import { resolvePlaintext } from './entityLanguageUtils.js';

const useSyncPagePlaintext = ({
  loaderLanguage,
  uiLanguage,
  initialPagePlaintext,
  mainDocument,
  setPagePlaintext,
}: {
  loaderLanguage: string;
  uiLanguage: string;
  initialPagePlaintext?: string;
  mainDocument?: FileType;
  setPagePlaintext: (text: string | undefined) => void;
}) => {
  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get(PAGE_PARAM) || '1';
  const isRawView = searchParams.get(VIEW_MODE_PARAM) === 'true';

  useEffect(() => {
    let cancelled = false;

    resolvePlaintext(mainDocument)
      .then(text => {
        if (cancelled) {
          return;
        }
        if (text !== undefined) {
          setPagePlaintext(text);
          return;
        }
        if (loaderLanguage === uiLanguage) {
          setPagePlaintext(initialPagePlaintext);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [
    initialPagePlaintext,
    loaderLanguage,
    uiLanguage,
    mainDocument,
    pageParam,
    isRawView,
    setPagePlaintext,
  ]);
};

export { useSyncPagePlaintext };
