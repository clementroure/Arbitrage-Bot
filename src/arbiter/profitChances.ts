const modelJson = {
    coefficients: [
        3.2249590845866583, -0.008487893619997352, -8.289355052151508,
        -2.7553679060180372e-5, 0.018381381764979644, 6.682066508973032,
        1.136819970260633e-7, -1.132177881582365e-5, -0.006509158078653439,
        -1.741753472222248,
    ],
};
// Define the 2D polynomial function
function polynomialFeatures2D({
    time,
    profit,
    degree,
}: {
    time: number;
    profit: number;
    degree: number;
}): number[] {
    const features = [1];
    for (let i = 1; i <= degree; i++) {
        for (let j = 0; j <= i; j++) {
            features.push(Math.pow(time, i - j) * Math.pow(profit, j));
        }
    }
    return features;
}

function polynomial2DFunction(time: number, profit: number): number {
    const degree = 3;
    const features = polynomialFeatures2D({ time, profit, degree });
    let result = 0;

    for (let i = 0; i < features.length; i++) {
        result += modelJson.coefficients[i] * features[i];
    }

    // Make sure result is between 0 and 1
    return Math.min(Math.max(result, 0), 1);
}

// Define the calculateProfitProbability function
export function calculateProfitProbability({
    type = "dex",
    delta,
    ttf,
    commission = 0, // Commission is only used for CEXs
}: {
    type: "dex" | "cex";
    delta: number;
    ttf: number;
    commission?: number;
}): number {
    if (type === "dex") {
        if (process.env.USE_TESTNET === "true") {
            return 1;
        }
        const availabilityScore = polynomial2DFunction(ttf * 10, delta * 10);

        return availabilityScore * (1 - commission);
    }
    return delta > commission ? 1 : 0;
}
