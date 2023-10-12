import usePriceStore from "../lib/priceDataStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { calculateProfitProbability } from "@/src/arbiter/profitChances";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from "recharts";
import { useEffect } from "react";
import useTradeBookStore from "../lib/tradesStore";
import { useToast } from "./ui/use-toast";

export default function Difference() {
    const { getArbitrage } = usePriceStore();
    const arbitrage = getArbitrage();
    const priceData1 = arbitrage.quote1;
    const priceData2 = arbitrage.quote2;

    if (!priceData1 || !priceData2) {
        return <Skeleton />;
    }

    const percentage = arbitrage.percentProfit;

    // const prob = calculateProfitProbability({
    //     ttf: Math.max(priceData1.ttf, priceData2.ttf), // 1 second
    //     delta: percentage
    // })

    // const data = [
    //     {
    //         subject: 'Difference',
    //         A: percentage,
    //         fullMark: 1,
    //     },
    //     {
    //         subject: 'Profit Probability',
    //         A: prob,
    //         fullMark: 1,
    //     },
    //     {
    //         subject: 'Time to finality',
    //         A: Math.max(priceData1.ttf, priceData2.ttf),
    //         fullMark: 15,
    //     },
    // ];

    // // If exchange supports bid/ask add this to the chart
    // if (priceData1.bid) {
    //     data.push({
    //         subject: 'Bid/Ask',
    //         A: priceData1.bid / priceData2.ask,
    //         fullMark: 1,
    //     });
    // }

    return (
        <>
            <div className="mt-4 flex justify-between items-center gap-4">
                <div className="w-full">
                    <div className="text-xl font-bold">
                        Difference: {percentage.toFixed(3)}%
                    </div>
                    <Progress value={percentage} />
                    <span className="text-sm text-gray-500">
                        {" "}
                        {arbitrage.exchange1} - {arbitrage.exchange2}
                    </span>
                </div>
                {/* <div className="w-full">
                <div className="text-xl font-bold">Probability of Profit: {(prob * 100).toFixed(2)}%</div>
                <Progress value={prob * 100} />
            </div> */}
            </div>
            {/* <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarAngleAxis dataKey="fullMark" />
                    <PolarRadiusAxis />
                    <Radar name="Data" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} animationDuration={0} />
                </RadarChart>
            </ResponsiveContainer>
        </div> */}
        </>
    );
}
