import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import usePriceStore from "../lib/priceDataStore";
export default function UniswapPrice({
    factoryAddress,
    routerAddress,
    tokenA,
    tokenB,
}) {
    const { priceData1, priceData2 } = usePriceStore();

    const priceData = id === 1 ? priceData1 : priceData2;

    const addLiquidity = async () => {
        const response = await fetch("/api/addLiquidity", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                routerAddress,
                liquidityA: 100,
                liquidityB: 100,
                tokenA,
                tokenB,
            }),
        });
        const result = await response.json();
        if (result.success) {
            console.log("Liquidity added");
            // Revalidate the price data
            mutate("/api/priceData");
        }
    };

    return (
        <div>
            {priceData.quote.price == 0 ? (
                <>
                    <Button onClick={addLiquidity}>Add sample liquidity</Button>
                </>
            ) : (
                <>
                    <div>Price: {priceData.quote.price}</div>
                </>
            )}
        </div>
    );
}
