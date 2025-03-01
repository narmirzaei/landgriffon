import { ChevronRightIcon } from '@heroicons/react/solid';
import classNames from 'classnames';
import { useCallback, useEffect, useState, useMemo } from 'react';

import type { HTMLAttributes } from 'react';

type AccordionEntryProps = React.PropsWithChildren<{
  header: React.ReactNode;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}>;

type AccordionProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> &
  (
    | {
        children?: undefined;
        entries: AccordionEntryProps[];
      }
    | (Required<React.PropsWithChildren> & { entries?: undefined })
  );

const AccordionEntry = ({ header, children, expanded, onExpandedChange }: AccordionEntryProps) => {
  const [localIsExpanded, setLocalIsExpanded] = useState(expanded ?? false);

  useEffect(() => {
    if (expanded === undefined) {
      return;
    }
    setLocalIsExpanded(expanded);
  }, [expanded]);

  useEffect(() => {
    onExpandedChange?.(localIsExpanded);
  }, [localIsExpanded, onExpandedChange]);

  const toggleExpand = useCallback(() => {
    setLocalIsExpanded?.((expanded) => !expanded);
  }, []);

  return (
    <div
      className={classNames('rounded-lg border border-gray-50 shadow divide-y divide-gray-100', {
        'bg-gray-50': localIsExpanded,
      })}
    >
      <div
        className="flex flex-row gap-2 p-2 pb-4 cursor-pointer place-items-start"
        onClick={toggleExpand}
      >
        <div className="h-fit">
          <ChevronRightIcon
            className={classNames('w-5 h-5 text-gray-500 my-auto', {
              'rotate-90': localIsExpanded,
            })}
          />
        </div>
        <div className="flex-grow">{header}</div>
      </div>
      {localIsExpanded && <div className="divide-y divide-gray-100">{children}</div>}
    </div>
  );
};

const Accordion = ({ entries, children, className, ...props }: AccordionProps) => {
  const childToRender = useMemo(
    () =>
      children === undefined
        ? entries.map((entry, i) => <AccordionEntry key={i} {...entry} />)
        : children,
    [children, entries],
  );

  return (
    <div className={classNames(className, 'flex flex-col gap-2')} {...props}>
      {childToRender}
    </div>
  );
};

Accordion.Entry = AccordionEntry;

export default Accordion;
