import React, { useState, ReactNode } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';

interface VerticalDrawerProps {
  title?: ReactNode;
  children: ReactNode;
  maxHeight?: string;
  className?: string;
  defaultOpen?: boolean;
}

const VerticalDrawer = ({
  title,
  children,
  maxHeight = 'h-fit',
  className = 'bg-white border-t border-gray-200 shadow-[0_-6px_12px_-3px_rgba(0,0,0,0.15)]',
  defaultOpen = false,
}: VerticalDrawerProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2">
        <div className="flex-1">{title}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">
              {isOpen ? <Translate>Close</Translate> : <Translate>Open</Translate>}
            </span>
            <span className="text-lg">
              {isOpen ? <ChevronDownIcon width={20} /> : <ChevronUpIcon width={20} />}
            </span>
          </button>
        </div>
      </div>

      <div
        aria-hidden={isOpen ? 'false' : 'true'}
        className={`${isOpen ? '' : 'hidden'} ${maxHeight} overflow-y-auto px-4 py-2`}
      >
        {children}
      </div>
    </div>
  );
};

export { VerticalDrawer };
