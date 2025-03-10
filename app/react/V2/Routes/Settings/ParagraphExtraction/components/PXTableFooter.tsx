import React from 'react';
import { PaginationState, Paginator } from 'V2/Components/UI';
import { useLocation } from 'react-router';
import { PX_EXTRACTORS_PER_PAGE } from '../pxConfig';

const PXTableFooter = ({
  totalPages = 0,
  total = 0,
  currentDataLength = 0,
  searchParams,
}: {
  totalPages: number;
  total: number;
  currentDataLength: number;
  searchParams: URLSearchParams;
}) => {
  const location = useLocation();

  return (
    <div className="flex justify-between h-6 items-center">
      <PaginationState
        page={Number(searchParams.get('page') || 1)}
        size={PX_EXTRACTORS_PER_PAGE}
        total={total || totalPages * PX_EXTRACTORS_PER_PAGE}
        currentLength={currentDataLength}
      />
      <div>
        <Paginator
          totalPages={totalPages}
          currentPage={searchParams.has('page') ? Number(searchParams.get('page')) : 1}
          buildUrl={(page: any) => {
            const innerSearchParams = new URLSearchParams(location.search);
            innerSearchParams.delete('page');
            innerSearchParams.set('page', page);
            return `${location.pathname}?${innerSearchParams.toString()}`;
          }}
        />
      </div>
    </div>
  );
};

export { PXTableFooter };
