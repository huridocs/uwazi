import { useCallback } from 'react';
import { useStore } from 'jotai';
import { useUpdateEntityUrl } from '#V2/Routes/Entity/entityUrlState.js';
import { entityPageAtom } from '../../entityUrlAtoms.js';
import { PAGE_PARAM } from '../../urlParams.js';

const usePdfPageParam = () => {
  const updateEntityUrl = useUpdateEntityUrl();
  const store = useStore();
  const updatePageParam = useCallback(
    (pageParam: number | string) => {
      if (String(pageParam) === store.get(entityPageAtom)) {
        return;
      }
      updateEntityUrl({
        hash: next => {
          next.set(PAGE_PARAM, String(pageParam));
        },
      });
    },
    [store, updateEntityUrl]
  );
  return { store, updateEntityUrl, updatePageParam };
};

export { usePdfPageParam };
