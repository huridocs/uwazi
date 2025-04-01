import React from 'react';
import { PaginationState, Paginator } from 'V2/Components/UI';
import { useLocation, useSearchParams } from 'react-router';

const PXTableFooter = ({
  totalPages = 0,
  total = 0,
  currentDataLength = 0,
}: {
  totalPages: number;
  total: number;
  currentDataLength: number;
}) => {
  const location = useLocation();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div className="flex justify-between h-6 items-center">
      <PaginationState
        page={Number(searchParams.get('page') || 1)}
        size={10}
        total={total || totalPages * 10}
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
