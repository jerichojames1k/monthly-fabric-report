import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FabCode {
  id: string;
  date: string;
  name: string;
  yards: number;
  defects: number;
}

interface NewFabCode {
  date: string;
  name: string;
  yards: number;
  defects: number;
}

export interface MonthlyReport {
  date?: string;
  name: string;
  totalDefects: number;
  totalYards: number;
  result: number;
}

interface FabCodeState {
  fabCodes: FabCode[];
  monthlyReport: MonthlyReport[];
  showMonthlyReport: boolean;
  setFabCode: (fabCodes: FabCode[]) => void;
  addFabCode: (fabCode: NewFabCode) => void;
  updateFabCode: (id: string, fabCode: NewFabCode) => void;
  removeFabCode: (id: string) => void;
  clearFabCodes: () => void;
  generateMonthlyReport: () => void;
  hideMonthlyReport: () => void;
  clearAllData: () => void;
}

export const useFabCodeStore = create<FabCodeState>()(
  persist(
    (set, get) => ({
      fabCodes: [],
      monthlyReport: [],
      showMonthlyReport: false,

      setFabCode: (fabCodes) => {
        set({ fabCodes });
      },

      // Add FAB Code
      addFabCode: (fabCode) => {
        if (fabCode?.name) {
          const newFabCode: FabCode = {
            id: crypto.randomUUID(),
            ...fabCode,
          };

          set((state) => ({
            fabCodes: [...state.fabCodes, newFabCode],
          }));
          return;
        }
        set((state) => ({
          fabCodes: [...state.fabCodes, ...(fabCode as any)],
        }));
      },

      // Update FAB Code
      updateFabCode: (id, fabCode) => {
        set((state) => ({
          fabCodes: state.fabCodes.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...fabCode,
                }
              : item,
          ),
        }));
      },

      // Remove FAB Code
      removeFabCode: (id) => {
        set((state) => ({
          fabCodes: state.fabCodes.filter((item) => item.id !== id),
        }));
      },

      clearFabCodes: () => {
        set({
          fabCodes: [],
        });
      },

      // Generate Monthly Report
      generateMonthlyReport: () => {
        const { fabCodes } = get();

        const answer = new Map<string, FabCode>();

        fabCodes.forEach((item) => {
          const value = answer.get(item.name);

          if (value) {
            const addData: FabCode = {
              ...item,

              // Keep the existing date
              // if the grouped record already has one
              date: value.date || item.date,

              yards: value.yards + item.yards,
              defects: value.defects + item.defects,
            };

            answer.set(item.name, addData);
          } else {
            answer.set(item.name, item);
          }
        });

        const report: MonthlyReport[] = Array.from(answer.values()).map(
          (item) => {
            const totalYards = item.yards;
            const totalDefects = item.defects;

            const result =
              totalDefects === 0
                ? 0
                : Number(((totalYards / totalDefects) * 0.1).toFixed(1));

            return {
              date: item.date,
              name: item.name,
              totalDefects,
              totalYards,
              result,
            };
          },
        );

        set({
          monthlyReport: report,
          showMonthlyReport: true,
        });
      },

      hideMonthlyReport: () => {
        set({
          showMonthlyReport: false,
        });
      },

      clearAllData: () => {
        set({
          fabCodes: [],
          monthlyReport: [],
          showMonthlyReport: false,
        });
      },
    }),

    {
      name: "fab-code-storage",
    },
  ),
);
