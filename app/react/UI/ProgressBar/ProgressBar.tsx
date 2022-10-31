import React from 'react';

type progressBarProps = {
  max?: number;
  value?: number;
  useProgressColors?: boolean;
  showNumericValue?: boolean;
};

const ProgressBar = ({
  max = 100,
  value = 0,
  useProgressColors = false,
  showNumericValue = true,
}: progressBarProps) => {
  const percentage = (100 * value) / max;
  let progressColor;

  switch (true) {
    case percentage < 40:
      progressColor = '#89E79E';
      break;

    case percentage > 80:
      progressColor = '#B24138';
      break;

    default:
      progressColor = '#F9CA70';
      break;
  }

  return (
    <div className="uw-progress-bar--container">
      <div className="uw-progress-bar">
        <div
          className="uw-progress-bar--progress"
          style={{
            width: `${percentage}%`,
            ...(useProgressColors && { backgroundColor: progressColor }),
          }}
        />
      </div>
      {showNumericValue && (
        <div className="uw-progress-bar--counter">
          {value}/{max}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
