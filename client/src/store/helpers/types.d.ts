import type { Atom } from 'jotai';

export type AtomValue<T extends Atom<unknown>> = T extends Atom<infer V> ? V : never;
