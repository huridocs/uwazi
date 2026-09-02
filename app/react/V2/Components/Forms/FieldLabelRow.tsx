import React from 'react';

type FieldLabelRowProps = {
  label: React.ReactNode;
  accessory?: React.ReactNode;
};

const FieldLabelRow = ({ label, accessory }: FieldLabelRowProps) =>
  accessory ? (
    <div className="flex min-h-4 items-center gap-2">
      {label}
      {accessory}
    </div>
  ) : (
    label
  );

export { FieldLabelRow };
export type { FieldLabelRowProps };
