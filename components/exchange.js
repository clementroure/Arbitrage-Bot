import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import useUniswapStore from "../lib/uniswapStore";
import { useContext, useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import usePriceStore from "../lib/priceDataStore";
import CexPrice from "./cexPrice";
import { Client, useClientState } from "../lib/client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExchangesList } from "../lib/exchanges";
import { useToast } from "./ui/use-toast";
import { PairContext, PairContextDispatch } from "./pair";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { NotificationCenter } from "@arguiot/broadcast.js";

export default function ExchangeCard({ environment, index }) {
    const [exchange, setExchange] = useState(null);
    const { tokenA, tokenB, followings } = useContext(PairContext);
    const dispatch = useContext(PairContextDispatch);
    const { getQuote } = usePriceStore();
    const [buy, setBuy] = useState(null);
    const { buying, setBuying } = useClientState();

    const { deploy } = useUniswapStore();

    const [isDeploying, setIsDeploying] = useState(false);


    const priceData = getQuote(exchange, tokenA.address, tokenB.address);

    async function deployExchange(value) {
        setIsDeploying(true);
        if (exchange) {
            exitExchange();
        }
        dispatch({ type: "addFollowing", payload: value });
        if (value === "local-uniswap") {
            await deploy();
        } else {
            Client.shared.subscribeToPriceData(
                value,
                environment,
                tokenA,
                tokenB
            );
        }
        setExchange(value);
        setIsDeploying(false);
    }

    useEffect(() => {
        const toDeploy = Object.entries(ExchangesList[environment])[index];
        if (toDeploy) {
            deployExchange(toDeploy[0]);
        }
    }, []);

    function exitExchange() {
        dispatch({ type: "removeFollowing", payload: exchange });
        Client.shared.unsubscribeFromPriceData(
            exchange,
            environment,
            tokenA,
            tokenB
        );
        setExchange(null);
    }

    function buyTokens() {
        const _tokenA = buy.token === tokenA ? tokenB : tokenA;
        const _tokenB = buy.token === tokenA ? tokenA : tokenB;
        const amountIn =
            buy.token == tokenB
                ? buy.amount / priceData.price
                : buy.amount * priceData.price;
        setBuying(true);
        Client.shared.buy(
            buy.exchange,
            environment,
            _tokenA,
            _tokenB,
            amountIn,
            parseFloat(buy.amount)
        );
    }

    const select = (
        <Select
            onValueChange={(value) => {
                deployExchange(value);
            }}
            value={exchange}
        >
            <SelectTrigger className="w-[180px]">
                {isDeploying && <Loader2 className="animate-spin" />}
                <SelectValue placeholder="Connect exchange" />
            </SelectTrigger>
            <SelectContent>
                {Object.entries(ExchangesList[environment])
                    .filter(
                        ([key]) => !followings.includes(key) || key === exchange
                    ) // filter out exchanges in followings
                    .map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                            {value.name}
                        </SelectItem>
                    ))}
            </SelectContent>
        </Select>
    );

    return (
        <Card className="w-1/2">
            {exchange !== null ? (
                <ContextMenu>
                    <ContextMenuTrigger>
                        <CardHeader>
                            <div className="flex justify-between">
                                <CardTitle>Exchange</CardTitle>
                                <X onClick={exitExchange} />
                            </div>
                            <CardDescription>{select}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between flex-col">
                                <CexPrice priceData={priceData} />
                                <div className="flex justify-between">
                                    {priceData && (
                                        <>
                                            <Button
                                                onClick={() =>
                                                    setBuy({
                                                        exchange,
                                                        token: tokenA,
                                                        amount: 0,
                                                        buying: false,
                                                    })
                                                }
                                            >
                                                Buy {tokenA.name}
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    setBuy({
                                                        exchange,
                                                        token: tokenB,
                                                        amount: 0,
                                                        buying: false,
                                                    })
                                                }
                                            >
                                                Buy {tokenB.name}
                                            </Button>
                                        </>
                                    )}
                                    <Dialog
                                        open={buy !== null}
                                        onOpenChange={(open) => {
                                            if (open === false) setBuy(null);
                                        }}
                                    >
                                        {buy && (
                                            <>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>
                                                            Buy {buy.token.name}{" "}
                                                            on{" "}
                                                            {
                                                                ExchangesList[
                                                                    environment
                                                                ][buy.exchange]
                                                                    .name
                                                            }
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Current balance:{" "}
                                                            {priceData.balanceA}{" "}
                                                            {
                                                                priceData.tokenA
                                                                    .name
                                                            }{" "}
                                                            /{" "}
                                                            {priceData.balanceB}{" "}
                                                            {
                                                                priceData.tokenB
                                                                    .name
                                                            }
                                                        </DialogDescription>
                                                        <div className="grid gap-4 py-4">
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label
                                                                    htmlFor="name"
                                                                    className="text-right"
                                                                >
                                                                    Amount
                                                                </Label>
                                                                <Input
                                                                    id="name"
                                                                    value={
                                                                        buy.amount
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setBuy({
                                                                            ...buy,
                                                                            amount: e
                                                                                .target
                                                                                .value,
                                                                        })
                                                                    }
                                                                    className="col-span-3"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label
                                                                    htmlFor="name"
                                                                    className="text-right"
                                                                >
                                                                    You pay
                                                                </Label>
                                                                <Input
                                                                    id="name"
                                                                    value={`${buy.token ==
                                                                        tokenB
                                                                        ? buy.amount /
                                                                        priceData.price
                                                                        : buy.amount *
                                                                        priceData.price
                                                                        } ${buy.token ==
                                                                            tokenB
                                                                            ? priceData
                                                                                .tokenA
                                                                                .name
                                                                            : priceData
                                                                                .tokenB
                                                                                .name
                                                                        }`}
                                                                    className="col-span-3"
                                                                    disabled
                                                                />
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={buyTokens}
                                                            disabled={buying}
                                                        >
                                                            {buying && (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            )}
                                                            🤑 Buy {buy.amount}{" "}
                                                            {buy.token.name}
                                                        </Button>
                                                    </DialogHeader>
                                                </DialogContent>
                                            </>
                                        )}
                                    </Dialog>
                                </div>
                            </div>
                        </CardContent>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        {ExchangesList[environment][exchange].routerAddress && (
                            <ContextMenuItem
                                onSelect={() => {
                                    navigator.clipboard.writeText(
                                        ExchangesList[environment][exchange]
                                            .routerAddress
                                    );
                                }}
                            >
                                Copy router address
                            </ContextMenuItem>
                        )}
                    </ContextMenuContent>
                </ContextMenu>
            ) : (
                <div className="relative">
                    <Skeleton className="relative h-96 w-full z-0" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        {select}
                    </div>
                </div>
            )}
        </Card>
    );
}
