import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import TradeBook from "../components/tradeBook";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Client, useClientState } from "../lib/client";
import { EstimatedTime } from "../components/ui/estimated-time";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokensView } from "../components/tokens";
import { PairsView } from "../components/pairsview";
import { useEnvironment } from "../lib/environment";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Status } from "@/components/pulse";

export default function Index() {
    const { connected, decisions, setDecisions, arbitrage } = useClientState();
    const [documentation, setDoc] = useState(0);

    const { toast } = useToast();

    const { environment, setEnvironment } = useEnvironment();

    useEffect(() => {
        Client.shared.connect();
    }, []);

    return (
        <>
            <div className="prose max-w-none mx-auto mt-8 px-8">
                <div className="flex justify-between items-center">
                    <h1>
                        <span onClick={() => {
                            setDoc(0);
                        }}
                        >
                            Arbitrage Bot
                        </span>
                        <Status connected={connected} />
                        <span
                            onClick={() => {
                                setDoc(1);
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700 pl-4"
                        >
                            Documentation
                        </span>
                        <span
                            onClick={() => {
                                setDoc(2);
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700 pl-4"
                        >
                            Tutorial
                        </span>
                    </h1>

                    <Select
                        value={environment}
                        onValueChange={(env) => {
                            setEnvironment(env);
                            Client.shared.reset();
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Environment" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="development">
                                🛠️ Development
                            </SelectItem>
                            <SelectItem value="production">
                                🌐 Production
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    {/* <ConnectKitButton /> */}
                </div>
                <Separator />
                {documentation == 0 && (
                    <>
                        <Tabs defaultValue="tokens" className="w-full mt-8">
                            <TabsList>
                                <TabsTrigger value="tradebook">
                                    Tradebook
                                </TabsTrigger>
                                <TabsTrigger value="pairs">Pairs</TabsTrigger>
                                <TabsTrigger value="tokens">Tokens</TabsTrigger>
                            </TabsList>
                            <TabsContent value="tradebook">
                                <TradeBook />
                            </TabsContent>
                            <TabsContent value="tokens">
                                <TokensView />
                            </TabsContent>
                            <TabsContent value="pairs">
                                <PairsView />
                            </TabsContent>
                        </Tabs>

                        {arbitrage && <EstimatedTime expectedTime={15000} />}
                        <Separator className="mt-8" />
                        <div className="flex justify-between mt-12">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    // reset storage
                                    localStorage.clear();

                                    {
                                        /* uniswapReset();
                            Client.shared.reset(); */
                                    }
                                    toast({
                                        title: "Reset",
                                        description: "Reset all data",
                                    });
                                }}
                            >
                                Reset
                            </Button>
                            {connected ? (
                                <Button
                                    variant={
                                        decisions ? "destructive" : "primary"
                                    }
                                    onClick={() => {
                                        if (!decisions) {
                                            Client.shared.subscribeToDecision();
                                        } else {
                                            Client.shared.unsubscribeFromDecision();
                                            toast({
                                                title: "Arbitrage Stopped",
                                                description:
                                                    "The bot is no longer looking for arbitrage opportunities",
                                            });
                                        }
                                        setDecisions(!decisions);
                                    }}
                                >
                                    {decisions ? "Stop" : "Start"} Arbitrage
                                </Button>
                            ) : (
                                <Skeleton className="w-1/4 h-12" />
                            )}
                        </div>
                    </>
                )}
            </div>
            {
                documentation == 1 && (
                    <iframe
                        src="/documentation/arbitrage_bot?language=objc"
                        className="w-full h-[calc(100vh-100px)] mt-0"
                    />
                )
            }
            {
                documentation == 2 && (
                    <iframe
                        src="/tutorials/tutorial"
                        className="w-full h-[calc(100vh-100px)] mt-0"
                    />
                )
            }
        </>
    );
}
