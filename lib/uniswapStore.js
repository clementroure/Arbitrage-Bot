import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useUniswapStore = create(
    persist(
        (set) => ({
            factory: null,
            router: null,
            weth: null,
            isDeployed: false,
            deploy: async function() {
                // Call the `/api/deploy` endpoint
                const response = await fetch("/api/deploy");
                const { factory, router, weth } = await response.json();
                set({ factory, router, weth, isDeployed: true });
            },
            setFactory: (factory) => set({ factory }),
            setRouter: (router) => set({ router }),
            reset: () =>
                set({
                    factory: null,
                    router: null,
                    weth: null,
                    isDeployed: false,
                }),
        }),
        {
            name: "uniswap-store",
            skipHydration: true,
            storage: createJSONStorage(() => window.localStorage),
        }
    )
);

export default useUniswapStore;
