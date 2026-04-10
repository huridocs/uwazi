import React, { ReactNode } from 'react';

type BlankStateProps = {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
};

const BlankState = ({ icon, title, description }: BlankStateProps) => (
  <div className="flex flex-col items-center justify-center h-full w-full text-center border border-dashed border-gray-200 rounded-2xl text-gray-500 gap-2 p-8">
    {icon}
    <p className="font-semibold text-lg">{title}</p>
    <p className="text-sm text-gray-400">{description}</p>
  </div>
);

export { BlankState };
