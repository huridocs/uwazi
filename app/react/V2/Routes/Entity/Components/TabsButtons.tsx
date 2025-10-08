import React, { useRef } from 'react';

interface TabButton {
  id: string;
  label: string;
  count?: number;
  active?: boolean;
  controls: string;
  icon?: React.ReactNode;
}

interface TabsButtonsProps {
  tabs: TabButton[];
  onTabClick?: (tabId: string) => void;
  className?: string;
}

const TabsButtons: React.FC<TabsButtonsProps> = ({ tabs, onTabClick, className = '' }) => {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusButton = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= tabs.length) return;
    const btn = buttonRefs.current[newIndex];
    if (btn) btn.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number, tabId: string) => {
    const key = (e.key || '').toLowerCase();
    // Stop bubbling to avoid parent handlers interfering
    e.stopPropagation();

    switch (key) {
      case 'arrowright':
      case 'right':
        e.preventDefault();
        focusButton((index + 1) % tabs.length);
        break;
      case 'arrowleft':
      case 'left':
        e.preventDefault();
        focusButton((index - 1 + tabs.length) % tabs.length);
        break;
      case 'home':
        e.preventDefault();
        focusButton(0);
        break;
      case 'end':
        e.preventDefault();
        focusButton(tabs.length - 1);
        break;
      case 'enter':
      case ' ': // Space
        e.preventDefault();
        onTabClick?.(tabId);
        break;
      default:
        break;
    }
  };

  return (
    <div className={`bg-white ${className}`}>
      <div className="flex shadow-sm rounded-lg w-fit" role="tablist" aria-orientation="horizontal">
        {tabs.map((tab, index) => {
          const isActive = tab.active;
          const isFirst = index === 0;
          const isLast = index === tabs.length - 1;
          const ariaLabel = `${tab.label}${tab.count !== undefined ? ` (${tab.count})` : ''}`;
          const ariaControls = tab.controls;

          return (
            <button
              key={tab.id}
              ref={el => {
                buttonRefs.current[index] = el;
              }}
              onClick={() => onTabClick?.(tab.id)}
              onKeyDown={e => onKeyDown(e, index, tab.id)}
              className={`border-gray-200 border-r ${isFirst ? 'rounded-l-lg' : ''} ${isLast ? 'rounded-r-lg border-r-0' : ''} px-3 py-1.5 flex items-center transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-700 min-h-[44px] min-w-[44px] md:min-w-0 md:min-h-0 ${isActive ? 'text-primary-700 bg-primary-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={ariaControls}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              aria-label={ariaLabel}
            >
              <span className="font-medium text-sm md:w-auto md:h-auto md:opacity-100 opacity-0 w-0 h-0">
                {tab.label}
              </span>
              {tab.icon && <span className="md:hidden block">{tab.icon}</span>}
              {tab.count !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${isActive ? 'bg-white text-violet-700' : 'bg-gray-100 text-gray-500'} ml-2`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { TabsButtons };

export type { TabButton };
