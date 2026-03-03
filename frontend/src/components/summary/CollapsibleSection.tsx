import { useState } from 'react';
import { SectionTitle } from '../shared';

interface Props {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleSection = ({ title, defaultOpen = true, children }: Props) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <svg
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-90' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <SectionTitle className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
          {title}
        </SectionTitle>
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
};
