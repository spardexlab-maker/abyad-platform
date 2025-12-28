import { useState, useEffect } from 'react';

// This is a simplified, custom implementation of the Zustand `create` function's core logic
// for managing global state within this project's constraints.

export const create = <T extends object>(createState: (set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void, get: () => T) => T) => {
  let state: T;
  const listeners = new Set<(state: T) => void>();

  const setState = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    const nextStatePartial = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...nextStatePartial };
    listeners.forEach((listener) => listener(state));
  };

  const getState = (): T => state;

  const subscribe = (listener: (state: T) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = createState(setState, getState);

  const useStore = (): T => {
    const [slice, setSlice] = useState(state);
    useEffect(() => {
      const unsub = subscribe(setSlice);
      return unsub;
    }, []);
    return slice;
  };
  
  // Attach non-reactive methods to the hook itself
  Object.assign(useStore, { getState, setState, subscribe });

  return useStore as (() => T) & { getState: () => T; setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void };
};