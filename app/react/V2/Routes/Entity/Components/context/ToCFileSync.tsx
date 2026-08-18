import { useEffect, useRef } from 'react';
import type { TocSchema } from '#shared/types/commonTypes.js';
import { useEntityLanguage } from './EntityLanguageContext.js';
import { useToc, useTocActions } from './TocContext.js';

const useToCFileSync = (toc: TocSchema[] | undefined, fileId: string | undefined) => {
  const { isEditMode } = useToc();
  const { setToc, reset } = useTocActions();
  const previousFileId = useRef(fileId);

  useEffect(() => {
    if (previousFileId.current !== fileId) {
      previousFileId.current = fileId;
      reset();
      setToc(toc);
      return;
    }
    if (!isEditMode) {
      setToc(toc);
    }
  }, [fileId, toc, isEditMode, setToc, reset]);
};

const ToCFileSync = () => {
  const { mainDocument } = useEntityLanguage();
  useToCFileSync(mainDocument?.toc, mainDocument?._id);
  return null;
};

export { ToCFileSync, useToCFileSync };
