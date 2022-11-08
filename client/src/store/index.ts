import { configureStore, combineReducers } from '@reduxjs/toolkit';

import analysisMap from 'store/features/analysis/map';

import type { ReducersMapObject } from '@reduxjs/toolkit';

const staticReducers = {
  'analysis/map': analysisMap,
};

const asyncReducers = {};

const createReducer = (reducers: ReducersMapObject) =>
  combineReducers({
    ...staticReducers,
    ...reducers,
  });

const createStore = () =>
  configureStore({
    reducer: createReducer(asyncReducers),
    devTools: process.env.NODE_ENV !== 'production',
  });

export type Store = ReturnType<typeof createStore>;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<Store['getState']>;

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = Store['dispatch'];

export default createStore;
