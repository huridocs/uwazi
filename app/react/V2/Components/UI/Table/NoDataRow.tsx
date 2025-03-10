import React from 'react';

interface NoDataRowProps {
  colSpan: number;
  DisplayElement: string | React.ReactNode;
}

const NoDataRow = ({ colSpan, DisplayElement }: NoDataRowProps) => (
  <tr>
    <td colSpan={colSpan}>{DisplayElement}</td>
  </tr>
);

export { NoDataRow };
