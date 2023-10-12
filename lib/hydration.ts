'use client';

import { useEffect } from 'react';

import { useEnvironment } from './environment';
import useUniswapStore from './uniswapStore';
import { usePairsStore, useTokensStore } from './pairs';
import useTradeBookStore from './tradesStore';
export default function Hydrations() {
    useEffect(() => {
        useEnvironment.persist.rehydrate();
        useUniswapStore.persist.rehydrate();
        useTokensStore.persist.rehydrate();
        usePairsStore.persist.rehydrate();
        useTradeBookStore.persist.rehydrate();
    }, []);

    return null;
}
