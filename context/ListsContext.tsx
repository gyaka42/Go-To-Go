// context/ListsContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from "react";
import { loadLists, saveLists } from "../utils/listsStorage";

export interface ListItem {
  key: string;
  icon: string;
  label: string;
  count: number | null;
}

export interface ListsContextType {
  lists: ListItem[];
  setLists: React.Dispatch<React.SetStateAction<ListItem[]>>;
}

export const ListsContext = createContext<ListsContextType>({
  lists: [],
  setLists: () => {},
});

interface ListsProviderProps {
  children: ReactNode;
}

export function ListsProvider({ children }: ListsProviderProps) {
  const [lists, setLists] = useState<ListItem[]>([]);

  useEffect(() => {
    loadLists().then((saved) => {
      setLists(saved);
    });
  }, []);

  useEffect(() => {
    saveLists(lists);
  }, [lists]);

  return (
    <ListsContext.Provider value={{ lists, setLists }}>
      {children}
    </ListsContext.Provider>
  );
}
