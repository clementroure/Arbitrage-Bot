import { EstimatedTime } from "./ui/estimated-time";

export default function CexPrice({ priceData }) {
    if (!priceData) {
        return (
            <div>
                <h4>Starting worker... </h4>
                <EstimatedTime expectedTime={10000} />
            </div>
        );
    }

    return (
        <div>
            <h3>
                <span className="text-green-500">·</span> Live Price:{" "}
                {priceData.price.toFixed(2)} {priceData.tokenB.name}
            </h3>
            {priceData.bid && (
                <>
                    <h3>
                        <span className="text-green-500">·</span> Bid:{" "}
                        {priceData.bid.toFixed(2)} {priceData.tokenB.name}
                    </h3>
                    <h3>
                        <span className="text-green-500">·</span> Ask:{" "}
                        {priceData.ask.toFixed(2)} {priceData.tokenB.name}
                    </h3>
                </>
            )}
            {/* {priceData.amount && (
                <>
                    <h3>
                        <span className="text-green-500">·</span> Amount:{" "}
                        {priceData.amount.toFixed(2)} {priceData.tokenA.name}
                    </h3>
                </>
            )} */}
            <p>
                Balance: {priceData.balanceA} {priceData.tokenA.name} /{" "}
                {priceData.balanceB} {priceData.tokenB.name}
            </p>
        </div>
    );
}
