import { expect } from "chai";
import { ethers } from "hardhat";
import { deployUniswapV2 } from "../../src/exchanges/deploy/deployUniswapV2";
import { UniswapV2 } from "../../src/exchanges/UniswapV2";
import IUniswapV2Pair from "@uniswap/v2-periphery/build/IUniswapV2Pair.json";
import { Token } from "@/src/exchanges/adapters/exchange";

export async function deployV2(
    N: number,
    dexes: string[],
    maxSpread: number = 0
) {
    await ethers.provider.send("hardhat_reset", []);
    const [deployer] = await ethers.getSigners();

    const uniswapInstances = [];
    for (let d = 0; d < dexes.length; d++) {
        const { factory, router, weth } = await deployUniswapV2(
            deployer as ethers.Wallet
        );
        const uniswapV2 = new UniswapV2(
            router,
            factory,
            deployer as ethers.Wallet
        );
        uniswapV2.name = dexes[d] as any;
        uniswapInstances.push(uniswapV2);
    }

    const tokenFactory = await ethers.getContractFactory("Token");

    const tokens = [];
    for (let i = 0; i < N; i++) {
        const token = await tokenFactory.deploy(
            `Token${i}`,
            `TK${i}`,
            18,
            ethers.utils.parseEther("1000000")
        );
        await token.deployed();
        console.log(`Token ${i} deployed at: `, token.address);
        tokens.push(token);
    }

    const pairs = [];
    for (const uniswapV2 of uniswapInstances) {
        const router = uniswapV2.delegate;
        const factory = uniswapV2.source;

        for (const token of tokens) {
            await token.approve(router.address, ethers.constants.MaxUint256);
        }

        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                const tokenX = tokens[i];
                const tokenY = tokens[j];
                const priceXtoWETH = Math.random();
                const priceYtoWETH = Math.random();
                const priceXtoY = priceXtoWETH / priceYtoWETH;

                const spread = maxSpread;
                const adjustedPriceXtoY = priceXtoY * (1 + spread);

                const liquidityX = ethers.utils.parseEther("1000");
                const liquidityY = liquidityX
                    .mul(
                        ethers.BigNumber.from(
                            Math.floor(adjustedPriceXtoY * 1e6)
                        ).mul(1e12)
                    )
                    .div(ethers.BigNumber.from(1e6).mul(1e12));

                await router
                    .connect(deployer)
                    .addLiquidity(
                        tokenX.address,
                        tokenY.address,
                        liquidityX,
                        liquidityY,
                        0,
                        0,
                        deployer.address,
                        ethers.constants.MaxUint256
                    );

                const pairAddress = await factory.getPair(
                    tokenX.address,
                    tokenY.address
                );
                const pair = new ethers.Contract(
                    pairAddress,
                    IUniswapV2Pair.abi,
                    deployer
                );
                pairs.push(pair);
            }
        }
    }

    return { uniswapInstances, tokens, pairs };
}

describe("Uniswap V2 Deployment", function() {
    // it("Should deploy N tokens and create pairs between all tokens for D Uniswap V2 instances", async function () {
    //     const N = 4; // Number of tokens to deploy
    //     const D = ["uniswap", "apeswap", "uniswap2"]; // Number of Uniswap V2 instances to deploy
    //     const { uniswapInstances, tokens, pairs } = await deployV2(N, D);

    //     // Check if D Uniswap V2 instances are deployed
    //     expect(uniswapInstances.length).to.equal(D.length);

    //     // Check if N tokens are deployed
    //     expect(tokens.length).to.equal(N);

    //     // Check if D * N * (N - 1) / 2 pairs are created
    //     expect(pairs.length).to.equal((D.length * (N * (N - 1))) / 2);

    //     // Check if all pairs have unique token addresses for each Uniswap V2 instance
    //     const pairTokenAddresses = new Set();
    //     for (const pair of pairs) {
    //         const token0 = await pair.token0();
    //         const token1 = await pair.token1();
    //         // expect(pairTokenAddresses.has(token0 + token1)).to.be.false;
    //         pairTokenAddresses.add(token0 + token1);
    //     }

    //     // Check if all pairs have non-zero liquidity
    //     for (const pair of pairs) {
    //         const reserves = await pair.getReserves();
    //         expect(reserves[0]).to.not.equal(0);
    //         expect(reserves[1]).to.not.equal(0);
    //     }

    //     // Check if Uniswap V2 can get the price of all pairs
    //     for (const uniswapV2 of uniswapInstances) {
    //         for (const pair of pairs) {
    //             const token0 = await pair.token0();
    //             const token1 = await pair.token1();

    //             const tokenA: Token = {
    //                 name: "tokenA",
    //                 address: token0,
    //             };

    //             const tokenB: Token = {
    //                 name: "tokenB",
    //                 address: token1,
    //             };

    //             const price = await uniswapV2.getQuote(10, tokenA, tokenB);
    //             expect(price).to.not.equal(0);
    //         }
    //     }
    // });
});
