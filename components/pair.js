import { PairList } from "../lib/pairs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ExchangeCard from "./exchange";
import { createContext, useEffect, useReducer, useState } from "react";
import { useClientState } from "../lib/client";
import { NotificationCenter } from "@arguiot/broadcast.js";

export const PairContext = createContext();
export const PairContextDispatch = createContext(); // Reducer dispatch

export default function Pair({ connected, environment, index: key }) {
    const { pairs, setPairs } = useClientState();

    const getInitialPair = () => {
        const allPairs = Object.values(PairList[environment]);
        const nthPair = allPairs[key];

        const initialPair =
            nthPair &&
                !pairs.includes(`${nthPair.tokenA?.ticker}/${nthPair.tokenB?.ticker}`)
                ? nthPair
                : allPairs.find((pair) => {
                    const name = `${pair.tokenA?.ticker}/${pair.tokenB?.ticker}`;
                    return !pairs.includes(name);
                });

        return {
            tokenA: initialPair.tokenA,
            tokenB: initialPair.tokenB,
            followings: [],
        };
    };

    const initial = getInitialPair();

    const [pair, dispatch] = useReducer(pairReducer, initial);

    const [currentPair, setCurrentPair] = useState(
        `${initial.tokenA?.ticker}/${initial.tokenB?.ticker}`
    );

    const selectedPair = async (pair) => {
        setPairs([...pairs.filter((name) => name !== currentPair), pair]);
        const { tokenA, tokenB } = PairList[environment][pair];
        dispatch({ type: "setTokenA", payload: tokenA });
        dispatch({ type: "setTokenB", payload: tokenB });
        setCurrentPair(pair);
    };

    return (
        <PairContext.Provider value={pair}>
            <PairContextDispatch.Provider value={dispatch}>
                <div className="flex justify-between items-center">
                    <h4>Used Pair</h4>
                    {connected ? (
                        <Select
                            onValueChange={selectedPair}
                            value={currentPair}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Pair" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(PairList[environment])
                                    .filter(
                                        (pair) =>
                                            !pairs.includes(pair) ||
                                            pair === currentPair
                                    )
                                    .map((pair) => (
                                        <SelectItem key={pair} value={pair}>
                                            {pair}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Skeleton className="w-1/4 h-12" />
                    )}
                </div>
                <div className="flex justify-between gap-4">
                    {connected ? (
                        <>
                            <ExchangeCard environment={environment} index={0} />
                            <ExchangeCard environment={environment} index={1} />
                            <ExchangeCard environment={environment} index={2} />
                        </>
                    ) : (
                        <>
                            <Skeleton className="w-1/2 h-96" />
                            <Skeleton className="w-1/2 h-96" />
                            <Skeleton className="w-1/2 h-96" />
                        </>
                    )}
                </div>
            </PairContextDispatch.Provider>
        </PairContext.Provider>
    );
}

function pairReducer(state, action) {
    switch (action.type) {
        case "setTokenA":
            return { ...state, tokenA: action.payload };
        case "setTokenB":
            return { ...state, tokenB: action.payload };
        case "addFollowing":
            return {
                ...state,
                followings: [...state.followings, action.payload],
            };
        case "removeFollowing":
            return {
                ...state,
                followings: state.followings.filter(
                    (following) => following !== action.payload
                ),
            };
        default:
            throw new Error();
    }
}
