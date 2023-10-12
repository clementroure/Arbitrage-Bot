import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ETH, USDC, USDT, BTC } from "@ledgerhq/crypto-icons-ui/react";
import { Badge } from "@/components/ui/badge";
import { useEnvironment } from "./environment";
import { Client } from "./client";

export const TokenList = {
    ETH: {
        // Use WETH address
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        name: "Ethereum",
        ticker: "ETH",
        decimals: 18,
        icon: <ETH />,
    },
    USDT: {
        address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        name: "Tether",
        ticker: "USDT",
        decimals: 6,
        icon: <USDT />,
    },
    WETH_BSCTESTNET: {
        address: "0x272473bFB0C70e7316Ec04cFbae03EB3571A8D8F",
        name: "ETH",
        ticker: "WETH_BSCTESTNET",
        decimals: 18,
        icon: <ETH />,
    },
    USDT_BSCTESTNET: {
        address: "0x0a1B8D7450F69d33803e8b084aBA9d2F858f6574",
        name: "USDT",
        ticker: "USDT_BSCTESTNET",
        decimals: 6,
        icon: <USDT />,
    },
    TKA_BSCTESTNET: {
        address: "0x9c36c0a6FFD4322c647572CACfc1d5C475c854CD",
        name: "TKA",
        ticker: "TKA_BSCTESTNET",
        decimals: 18,
        icon: <Badge>TKA</Badge>,
    },
    TKB_BSCTESTNET: {
        address: "0xBf8C59a713927773f9Bf1BCcE21269f7bd95BC6c",
        name: "TKB",
        ticker: "TKB_BSCTESTNET",
        decimals: 18,
        icon: <Badge>TKB</Badge>,
    },
    USDC: {
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        name: "USD Coin",
        ticker: "USDC",
        decimals: 6,
        icon: <USDC />,
    },
    BTC: {
        address: null,
        name: "Bitcoin",
        ticker: "BTC",
        decimals: 8,
        icon: <BTC />,
    },
    AAVE: {
        address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
        name: "Aave",
        ticker: "AAVE",
        decimals: 18,
        icon: <Badge>AAVE</Badge>,
    },
};

export const useTokensStore = create(
    persist(
        (set) => ({
            tokens: Object.values(TokenList),
            addToken: (token: { address: string; name: string; decimals: number }) =>
                set((state) => ({
                    tokens: [...state.tokens, token],
                })),
            removeToken: (address: string) =>
                set((state) => ({
                    tokens: state.tokens.filter(
                        (token) => token.address !== address
                    ),
                })),
        }),
        {
            name: "tokens-store",
            skipHydration: true,
            storage: createJSONStorage(() => window.localStorage),
        }
    )
);

export const PairList = {
    development: {
        "ETH/USDT": {
            tokenA: TokenList.WETH_BSCTESTNET,
            tokenB: TokenList.USDT_BSCTESTNET,
        },
        "TKA/TKB": {
            tokenA: TokenList.TKA_BSCTESTNET,
            tokenB: TokenList.TKB_BSCTESTNET,
        },
        "ETH/TKA": {
            tokenA: TokenList.WETH_BSCTESTNET,
            tokenB: TokenList.TKA_BSCTESTNET,
        },
        "TKB/USDT": {
            tokenA: TokenList.TKB_BSCTESTNET,
            tokenB: TokenList.USDT_BSCTESTNET,
        },
    },
    production: {
        "ETH/USDT": {
            tokenA: TokenList.ETH,
            tokenB: TokenList.USDT,
        },
        "ETH/USDC": {
            tokenA: TokenList.ETH,
            tokenB: TokenList.USDC,
        },
        "ETH/BTC": {
            tokenA: TokenList.ETH,
            tokenB: TokenList.BTC,
        },
        "AAVE/ETH": {
            tokenA: TokenList.AAVE,
            tokenB: TokenList.ETH,
        },
    },
};

export type Pair = {
    tokenA: { address: string; name: string; ticker: string; decimals: number };
    tokenB: { address: string; name: string; ticker: string; decimals: number };
};

export const usePairsStore = create(
    persist(
        (set, get) => ({
            prodPairs: Object.values(PairList.production),
            devPairs: Object.values(PairList.development),
            pairs: () => {
                return useEnvironment.getState().environment == "production"
                    ? get().prodPairs
                    : get().devPairs;
            },
            addPair: (pair: Pair) =>
                set((state) => {
                    return useEnvironment.getState().environment == "production"
                        ? {
                            devPairs: state.devPairs,
                            prodPairs: [...state.prodPairs, pair],
                        }
                        : {
                            devPairs: [...state.devPairs, pair],
                            prodPairs: state.prodPairs,
                        };
                }),
            removePair: (pair: Pair) =>
                set((state) => {
                    const env = useEnvironment.getState().environment
                    Client.shared.unsubscribeFromPriceData(env, pair.tokenA, pair.tokenB)
                    return env == "production"
                        ? {
                            devPairs: state.devPairs,
                            prodPairs: state.prodPairs.filter(
                                (p: Pair) => !(p.tokenA.address === pair.tokenA.address && p.tokenB.address === pair.tokenB.address)
                            ),
                        }
                        : {
                            devPairs: state.devPairs.filter(
                                (p: Pair) =>
                                    p.tokenA.address !==
                                    pair.tokenA.address &&
                                    p.tokenB.address !== pair.tokenB.address
                            ),
                            prodPairs: state.prodPairs,
                        };
                }),
        }),
        {
            name: "pairs-store",
            skipHydration: true,
            storage: createJSONStorage(() => window.localStorage),
        }
    )
);
