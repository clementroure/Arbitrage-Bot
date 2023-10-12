"use client";

import { toast } from "../components/ui/use-toast";
import { Token } from "../scripts/exchanges/adapters/exchange";
import { ExchangesList } from "./exchanges";
import usePriceStore from "./priceDataStore";
import { create } from "zustand";
import useTradeBookStore from "./tradesStore";
import { usePairsStore } from "./pairs";
import { useEnvironment } from "./environment";
import { usePulseStore } from "../components/pulse";
interface WebSocket {
    onclose: ((event: CloseEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onopen: ((event: Event) => void) | null;
    close(code?: number, reason?: string): void;
    send(data: string | ArrayBuffer | Blob | ArrayBufferView): void;
}

export const useClientState = create((set) => ({
    pairs: [],
    connected: false,
    decisions: false,
    buying: false,
    arbitrage: false,
    setPairs: (pairs: string[]) => set({ pairs }),
    setConnnected: (connected: boolean) => set({ connected }),
    setDecisions: (decisions: boolean) => set({ decisions }),
    setArbitrage: (arbitrage: boolean) => set({ arbitrage }),
    setBuying: (buying: boolean) => {
        if (buying === false) {
            set({ buying, buy: null });
        } else {
            set({ buying });
        }
    },
}));

export class Client {
    url = "ws://localhost:8080/";
    ws: WebSocket;
    reconnectTimer: any;

    static shared: Client = new Client();

    subscriptions: Set<string> = new Set(); // exchange:pair

    connect() {
        if (this.ws) {
            this.ws.close();
        }
        this.ws = new WebSocket(this.url);
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
        this.ws.onclose = this.onClose.bind(this);
    }

    onOpen() {
        console.log("Connected to server");
        useClientState.getState().setConnnected(true);
        clearTimeout(this.reconnectTimer);
        this.reset();
    }

    onClose() {
        console.log("Disconnected from server");
        useClientState.getState().setConnnected(false);
        this.reconnectTimer = setTimeout(() => this.connect(), 1000);
    }

    onMessage(event: MessageEvent) {
        let message;
        try {
            message = JSON.parse(event.data);
        } catch (e) {
            console.log("Error parsing message", event.data);
            return;
        }
        usePulseStore.getState().triggerPulse();
        switch (message.topic) {
            case "notify":
                toast({
                    title: message.title,
                    description: message.message,
                });
                if (message.action === "started_arbitrage") {
                    useClientState.getState().setArbitrage(true);
                }
                break;
            case "priceData":
                if (typeof message.quote !== "undefined") {
                    usePriceStore
                        .getState()
                        .addQuote(message.quote.exchangeName, message.quote.tokenA.address, message.quote.tokenB.address, {
                            ...message.quote,
                            balanceA: message.balanceA,
                            balanceB: message.balanceB,
                            timestamp: Date.now(),
                        });
                }
                break;
            case "buy":
                if (message.status === "success") {
                    useClientState.getState().setBuying(false);
                    const receipt = message.receipt;
                    toast({
                        title: "Success",
                        description: (
                            <>
                                {`Bought ${receipt.amountOut} ${receipt.tokenB.name} for ${receipt.amountIn} ${receipt.tokenA.name}`}
                                <br />
                                <a
                                    href={`https://etherscan.io/tx/${receipt.transactionHash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    View on Etherscan
                                </a>
                            </>
                        ),
                    });
                }
                break;
            case "decision":
                if (!message.executedTrade) {
                    break;
                }
                toast({
                    title: "Decision",
                    description: <>{JSON.stringify(message)}</>,
                });

                useTradeBookStore.getState().addTrade(message.executedTrade);

                useClientState.getState().setArbitrage(false);
                break;
            case "reset":
                this.reset();
                break;
            default:
                console.log("Unknown message", message);
        }
    }

    send(message: string) {
        if (
            this.ws.readyState === WebSocket.OPEN &&
            useClientState.getState().connected
        ) {
            return this.ws.send(message);
        }
        console.log("Websocket not open, not sending message", message);
        setTimeout(() => this.send(message), 1000);
    }

    // MARK: - Exchange messages with server

    subscribeToPriceData(
        exchange: string,
        environment: "development" | "production",
        tokenA: Token,
        tokenB: Token
    ) {
        if (
            typeof tokenA === "undefined" ||
            typeof tokenA.name === "undefined" ||
            typeof tokenB === "undefined" ||
            typeof tokenB.name === "undefined" ||
            typeof exchange === "undefined"
        ) {
            return;
        }
        if (
            this.subscriptions.has(`${exchange}-${tokenA.name}-${tokenB.name}`)
        ) {
            return;
        }
        console.log({ tokenA, tokenB });
        const exchangeMetadata = ExchangesList[environment][exchange];
        this.send(
            JSON.stringify({
                type: "subscribe",
                topic: "priceData",
                environment,
                query: {
                    exchange,
                    type: exchangeMetadata.type,
                    tokenA,
                    tokenB,
                    routerAddress: exchangeMetadata.routerAddress,
                    factoryAddress: exchangeMetadata.factoryAddress,
                },
            })
        );
        this.subscriptions.add(`${exchange}-${tokenA.name}-${tokenB.name}`);
    }

    subscribeToAll() {
        const env = useEnvironment.getState().environment;
        const list =
            env === "production"
                ? ExchangesList.production
                : ExchangesList.development;
        Object.keys(list).forEach((exchange) => {
            usePairsStore
                .getState()
                .pairs()
                .forEach((pair) => {
                    this.subscribeToPriceData(
                        exchange,
                        env,
                        pair.tokenA,
                        pair.tokenB
                    );
                });
        });
    }

    unsubscribeFromPriceData(
        environment: "development" | "production",
        tokenA: Token,
        tokenB: Token
    ) {
        const list =
            environment === "production"
                ? ExchangesList.production
                : ExchangesList.development;
        Object.keys(list).forEach((exchange) => {
            const exchangeMetadata = ExchangesList[environment][exchange];
            this.send(
                JSON.stringify({
                    type: "unsubscribe",
                    topic: "priceData",
                    environment,
                    query: {
                        exchange,
                        type: exchangeMetadata.type,
                        tokenA,
                        tokenB,
                        routerAddress: exchangeMetadata.routerAddress,
                        factoryAddress: exchangeMetadata.factoryAddress,
                    },
                })
            );
        });
    }

    subscribeToDecision() {
        this.send(
            JSON.stringify({
                type: "subscribe",
                topic: "decision",
            })
        );
    }

    unsubscribeFromDecision() {
        this.send(
            JSON.stringify({
                type: "unsubscribe",
                topic: "decision",
            })
        );
    }

    buy(
        exchange: string,
        environment: "development" | "production",
        tokenA: Token,
        tokenB: Token,
        amountOfA: number,
        amountOfB: number
    ) {
        useClientState.getState().setBuying(true);
        const exchangeMetadata = ExchangesList[environment][exchange];
        this.send(
            JSON.stringify({
                type: "buy",
                topic: "buy",
                query: {
                    exchange,
                    type: exchangeMetadata.type,
                    tokenA,
                    tokenB,
                    amountIn: amountOfA,
                    amountOut: amountOfB,
                    routerAddress: exchangeMetadata.routerAddress,
                    factoryAddress: exchangeMetadata.factoryAddress,
                },
            })
        );
    }

    reset() {
        this.subscriptions.clear();
        this.environment(useEnvironment.getState().environment);
        this.subscribeToAll();
    }

    environment(env: "development" | "production") {
        this.send(
            JSON.stringify({
                type: "update",
                topic: "environment",
                environment: env,
            })
        );
    }
}
