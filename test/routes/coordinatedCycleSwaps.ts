import { ethers } from "hardhat";
import { deployV2 } from "./deployV2";

describe("Coordinate Cycle Swaps", () => {
    // it("should find the best cycle swap", async () => {
    //     const N = 5; // Number of tokens to deploy
    //     const D = ["uniswap", "apeswap", "uniswap2"]; // Number of Uniswap V2 instances to deploy
    //     const { uniswapInstances, pairs } = await deployV2(N, D, 0.5); // 50% spread, although it's big, it can actually happen in real life

    //     const quotes = {};
    //     for (const uniswapV2 of uniswapInstances) {
    //         for (const pair of pairs) {
    //             const token0 = await pair.token0();
    //             const token1 = await pair.token1();

    //             const tokenA = {
    //                 name: "tokenA",
    //                 address: token0,
    //             };

    //             const tokenB = {
    //                 name: "tokenB",
    //                 address: token1,
    //             };

    //             const price = await uniswapV2.getQuote(10, tokenA, tokenB);
    //             const pairName = `${token0}-${token1}`;
    //             quotes[pairName] = quotes[pairName] || {};
    //             quotes[pairName][uniswapV2.name] = price;
    //         }
    //     }

    //     const interRoute = await interExchangeRoute(quotes);

    //     console.log(JSON.stringify(interRoute, null, 2));

    //     expect(interRoute).to.exist;
    // });

    it("should execute cycle swap", async () => {
        const N = 5; // Number of tokens to deploy
        const D = ["uniswap", "apeswap", "uniswap2"]; // Number of Uniswap V2 instances to deploy
        const { uniswapInstances, pairs } = await deployV2(N, D, 0.5); // 50% spread, although it's big, it can actually happen in real life

        // Deploy SwapRouteCoordinator
        const SwapRouteCoordinator = await ethers.getContractFactory(
            "SwapRouteCoordinator"
        );
        const swapRouteCoordinator = await SwapRouteCoordinator.deploy();
        await swapRouteCoordinator.deployed();
        console.log(
            "SwapRouteCoordinator deployed to:",
            swapRouteCoordinator.address
        );

        // Deploy ArbitrageUniswapV2
        const ArbitrageUniswapV2 = await ethers.getContractFactory(
            "ArbitrageUniswapV2"
        );
        const arbitrageUniswapV2 = await ArbitrageUniswapV2.deploy(); // We'll use the same intermediary for all the swaps
        await arbitrageUniswapV2.deployed();
        console.log(
            "ArbitrageUniswapV2 deployed to:",
            arbitrageUniswapV2.address
        );

        const startAmount = ethers.utils.parseEther("1");

        const intermediaries = [
            arbitrageUniswapV2.address,
            arbitrageUniswapV2.address,
            arbitrageUniswapV2.address
        ];

        const tokens = [
            await pairs[0].token0(),
            await pairs[0].token1(),
            await pairs[0].token0()
        ];

        const routerAddresses = [
            uniswapInstances[0].delegate.address,
            uniswapInstances[1].delegate.address,
            uniswapInstances[0].delegate.address // Repayment
        ];


        console.log("initiateArbitrage(uint256 startAmount,address lapExchange,address[] intermediaries,address[] tokens,address[] data)");
        console.log("startAmount: ", startAmount.toString());
        console.log("lapExchange: ", arbitrageUniswapV2.address);
        console.log("intermediaries: ", intermediaries);
        console.log("tokens: ", tokens);
        console.log("data: ", routerAddresses);

        const tx = await swapRouteCoordinator.initiateArbitrage(
            startAmount,
            arbitrageUniswapV2.address,
            intermediaries,
            tokens,
            routerAddresses
        )
        const receipt = await tx.wait();
        // Amount out is returned from the call
        const event = receipt.events?.find(e => e.event == 'Arbitrage');

        const eventResult = swapRouteCoordinator.interface.parseLog(event as any);
        console.log(eventResult.args.amountOut.toString());
    });
});
