import React from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { PaginationState, Paginator } from 'V2/Components/UI';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';

const PXTableFooter = ({
  total = 0,
  currentDataLength = 0,
}: {
  total: number;
  currentDataLength: number;
}) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { page: currentPage = 1, size = 10 } = searchParamsFromSearchParams(searchParams);

  return (
    <div className="flex justify-between h-6 items-center">
      <PaginationState
        page={Number(searchParams.get('page') || 1)}
        size={size}
        total={total}
        currentLength={currentDataLength}
      />
      <div>
        <Paginator
          totalPages={Math.ceil(total / size)}
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
