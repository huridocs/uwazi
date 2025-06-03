import React from 'react';

type DateRangeContainerProps = {
  className?: string;
  id: string;
  children: React.ReactNode;
};

export const DateRangeContainer: React.FC<DateRangeContainerProps> = ({
  className = '',
  id,
  children,
}) => {
  return (
    <div className={`tw-content ${className}`} data-test-id={id}>
      <div id="tw-container" className="tw-datepicker z-[100] w-full p-0" />
      {children}
    </div>
  );
};
