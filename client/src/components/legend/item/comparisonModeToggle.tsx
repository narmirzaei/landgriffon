import classNames from 'classnames';
import { useAtom } from 'jotai';
import { useCallback } from 'react';

import { comparisonModeAtom } from 'store/atoms';

import type { ScenarioComparisonMode } from 'store/atoms';

const COMMON_MODE_BUTTON_CLASSNAMES = 'border px-1 p-0.5';
const ACTIVE_BUTTON_CLASSNAMES = 'text-navy-400 border-navy-400 bg-navy-50';
const DISABLED_BUTTON_CLASSNAMES = 'text-gray-400 border-gray-400';

export const ComparisonToggle = () => {
  const [comparisonMode, setComparisonMode] = useAtom(comparisonModeAtom);

  const getHandleChangeComparison = useCallback(
    (mode: ScenarioComparisonMode) => () => setComparisonMode(mode),
    [setComparisonMode],
  );

  return (
    <div className="flex flex-row text-xs w-fit">
      <button
        className={classNames(
          COMMON_MODE_BUTTON_CLASSNAMES,
          'rounded-l-md',
          comparisonMode === 'absolute' ? ACTIVE_BUTTON_CLASSNAMES : DISABLED_BUTTON_CLASSNAMES,
          {
            'border-r-0': comparisonMode !== 'absolute',
          },
        )}
        type="button"
        onClick={getHandleChangeComparison('absolute')}
      >
        absolute
      </button>
      <button
        type="button"
        className={classNames(
          COMMON_MODE_BUTTON_CLASSNAMES,
          'rounded-r-md',
          comparisonMode === 'relative' ? ACTIVE_BUTTON_CLASSNAMES : DISABLED_BUTTON_CLASSNAMES,
          {
            'border-l-0': comparisonMode !== 'relative',
          },
        )}
        onClick={getHandleChangeComparison('relative')}
      >
        relative
      </button>
    </div>
  );
};
