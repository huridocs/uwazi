import React from 'react';

const Steppers = ({
  step,
  steps,
  isDisabled,
  activeColor = 'bg-indigo-700',
  inactiveColor = 'bg-gray-200',
}: {
  step: number;
  steps: number;
  isDisabled?: boolean;
  activeColor?: string;
  inactiveColor?: string;
}) => {
  const isActiveStepClassName = (isActive: boolean) => (isActive ? activeColor : inactiveColor);

  return (
    <div className={`flex justify-center w-full gap-2 ${isDisabled ? 'opacity-50' : ''}`}>
      {Array.from({ length: steps }).map((_, index) => (
        <div
          key={`step-${index + 1}`}
          className={`w-2 h-2 rounded-full ${isActiveStepClassName(index === step - 1)}`}
        />
      ))}
    </div>
  );
};

export { Steppers };
