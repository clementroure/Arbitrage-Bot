import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Client } from "./client";

export const useEnvironment = create(
    persist(
        (set, get) => ({
            environment: process.env.USE_TESTNET ? "development" : "production",
            setEnvironment: (env) => {
                set({ environment: env });
            },
        }),
        {
            name: "environment",
            skipHydration: true,
            storage: createJSONStorage(() => window.localStorage),
        }
    )
);
