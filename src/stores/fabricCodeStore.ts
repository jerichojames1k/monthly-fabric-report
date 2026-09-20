import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FabCode {
  id: string;
  name: string;
  yards: number;
  defects: number;
}

interface NewFabCode {
  name: string;
  yards: number;
  defects: number;
}

interface FabCodeState {
  fabCodes: FabCode[];

  setFabCode: (fabCodes: FabCode[]) => void;
  addFabCode: (fabCode: NewFabCode) => void;
  updateFabCode: (id: string, fabCode: NewFabCode) => void;
  removeFabCode: (id: string) => void;
  clearFabCodes: () => void;
}


export const useFabCodeStore = create<FabCodeState>()(
  persist(
    (set) => ({
      fabCodes: [],

      setFabCode: (fabCodes) => {
        set({ fabCodes });
      },

      // UUID is generated here
      addFabCode: (fabCode) => {
        const newFabCode: FabCode = {
          id: crypto.randomUUID(),
          ...fabCode,
        };

        set((state) => ({
          fabCodes: [...state.fabCodes, newFabCode],
        }));
      },

      updateFabCode: (id, fabCode) => {
        set((state) => ({
          fabCodes: state.fabCodes.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...fabCode,
                }
              : item
          ),
        }));
      },

      removeFabCode: (id) => {
        set((state) => ({
          fabCodes: state.fabCodes.filter(
            (item) => item.id !== id
          ),
        }));
      },

      clearFabCodes: () => {
        set({
          fabCodes: [],
        });
      },
    }),

    {
      name: "fab-code-storage",
    }
  )
);