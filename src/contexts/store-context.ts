import { createContext } from 'react';
import { StoreContextValue } from './types';

const initialContextValue: StoreContextValue = {
  selectedDatasource: null,
  error: null,
  isLoading: false,
  setSelectedDatasource: () => {},
};

export const StoreContext = createContext<StoreContextValue>(initialContextValue);
