import { atomWithStorage, unstable_NO_STORAGE_VALUE as NO_STORAGE_VALUE } from 'jotai/utils';
import Router from 'next/router';
import { atom, useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { INITIAL_VIEW_STATE } from 'components/map';

import type { Dispatch } from 'react';
import type { Atom } from 'jotai';
import type { Scenario } from 'containers/scenarios/types';

const defaultSerialize = <T>(value: T): string => {
  if (value === undefined) return undefined;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

const defaultDeserialize = <T>(value: string): T => {
  if (value === undefined) return undefined;

  try {
    return JSON.parse(value);
  } catch {
    return value as T;
  }
};

interface AtomStorageOptions<T> {
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  onChange?: Dispatch<T>;
}

export const useOnAtomChange = <T>(atom: Atom<T>, onChange: Dispatch<T>) => {
  const value = useAtomValue(atom);
  useEffect(() => {
    onChange(value);
  }, [onChange, value]);
};

const atomWithQueryParamStorage = <T>(
  key: string,
  initialValue: T,
  {
    serialize = defaultSerialize,
    deserialize = defaultDeserialize,
    onChange,
  }: AtomStorageOptions<T> = {},
) => {
  return atomWithStorage<T>(key, initialValue, {
    delayInit: true,
    removeItem: async (key) => {
      const url = new URL(Router.asPath);
      url.searchParams.delete(key);

      await Router.replace({ ...url, query: url.toString() }, undefined, { shallow: true });
    },
    // eslint-disable-next-line require-await
    getItem: (key) => {
      if (!(key in Router.query) || !Router.isReady) return NO_STORAGE_VALUE;
      const queryValue = Router.query[key] as string;

      const value = deserialize(queryValue);
      if (!value) return NO_STORAGE_VALUE;

      return value;
    },
    setItem: async (key, newValue) => {
      const query = Router.query;

      if (!newValue) {
        delete query[key];
      } else {
        query[key] = serialize(newValue);
      }
      onChange?.(newValue);
      await Router.replace({ query }, undefined, { shallow: true });
    },
    subscribe: (key, setValue) => {
      const callback = () => {
        const queryValue = Router.query[key] as string;
        if (!queryValue) return;
        setValue(deserialize(queryValue));
      };
      Router.events.on('routeChangeComplete', callback); // Subscribe to next router
      window.addEventListener('hashchange', callback);
      return () => {
        Router.events.off('routeChangeComplete', callback); // Unsubscribe to next router
        window.removeEventListener('hashchange', callback);
      };
    },
  });
};

export const viewStateAtom = atom(INITIAL_VIEW_STATE);
export const currentScenarioAtom = atomWithQueryParamStorage<Scenario['id']>('scenarioId', null);
export const compareScenarioIdAtom = atomWithQueryParamStorage<Scenario['id']>(
  'compareScenarioId',
  null,
);

export const isComparisonEnabledAtom = atom((get) => {
  const scenarioId = get(currentScenarioAtom);
  const scenarioCompId = get(compareScenarioIdAtom);

  return !!scenarioId && !!scenarioCompId;
});
