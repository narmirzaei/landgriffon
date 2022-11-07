import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

import type { Atom } from 'jotai';
import type { Dispatch } from 'react';

const useOnAtomChange = <T>(atom: Atom<T>, onChange: Dispatch<T>) => {
  const value = useAtomValue(atom);
  useEffect(() => {
    onChange(value);
  }, [onChange, value]);
};
export default useOnAtomChange;
