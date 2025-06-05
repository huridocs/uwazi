import React from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { PaginationState, Paginator } from 'V2/Components/UI';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';
import { PAGE_SIZE } from '../Loaders';

const PXTableFooter = ({
  total = 0,
  currentDataLength = 0,
}: {
  total: number;
  currentDataLength: number;
}) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { page: currentPage = 1 } = searchParamsFromSearchParams(searchParams);

  return (
    <div className="flex items-center justify-between h-6">
      <PaginationState
        page={Number(searchParams.get('page') || 1)}
        size={PAGE_SIZE}
        total={total}
        currentLength={currentDataLength}
      />
      <div>
        <Paginator
          totalPages={Math.ceil(total / PAGE_SIZE)}
          currentPage={Number(currentPage)}
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
