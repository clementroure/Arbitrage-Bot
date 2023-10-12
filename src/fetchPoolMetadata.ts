import { ethers } from "ethers";
import {
    Pool,
    TickMath,
    Position,
    FeeAmount,
    computePoolAddress,
} from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";
import IUniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import NonfungiblePositionManager from "@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json";
import JSBI from "jsbi";

const provider = new ethers.providers.JsonRpcProvider(
    "https://eth.pr1mer.tech/v1/mainnet"
);

async function fetchPositionFromNFT(nftId: number) {
    const positionManagerAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

    const positionManagerContract = new ethers.Contract(
        positionManagerAddress,
        NonfungiblePositionManager.abi,
        provider
    );
    const positionData = await positionManagerContract.positions(nftId);

    // Get the pool address
    const factoryAddress = await positionManagerContract.factory();

    const tokenA = new Token(1, positionData.token0, 18);
    const tokenB = new Token(1, positionData.token1, 18);

    const poolAddress = computePoolAddress({
        factoryAddress,
        tokenA,
        tokenB,
        fee: positionData.fee,
    });

    const poolContract = new ethers.Contract(
        poolAddress,
        IUniswapV3Pool.abi,
        provider
    );
    const poolInfo = await poolContract.slot0();
    const liquidity = await poolContract.liquidity();

    // Calculate the amounts of token0 and token1 provided
    // const sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(positionData.tickLower);
    // const sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(positionData.tickUpper);

    const position = new Position({
        pool: new Pool(
            tokenA,
            tokenB,
            positionData.fee,
            poolInfo.sqrtPriceX96,
            liquidity,
            poolInfo.tick
        ),
        tickLower: positionData.tickLower,
        tickUpper: positionData.tickUpper,
        liquidity: positionData.liquidity,
    });

    const amount0 = position.amount0.quotient.toString();
    const amount1 = position.amount1.quotient.toString();

    console.log(`Token ID: ${nftId}`);
    // console.log(`Pool Address: ${pool}`);
    console.log(`Token 0 Address: ${positionData.token0}`);
    console.log(`Token 1 Address: ${positionData.token1}`);
    console.log(`Tick Lower: ${positionData.tickLower}`);
    console.log(`Tick Upper: ${positionData.tickUpper}`);
    console.log(`Liquidity: ${positionData.liquidity}`);
    console.log(`Amount 0: ${amount0}`);
    console.log(`Amount 1: ${amount1}`);
}

if (process.argv.length !== 3) {
    console.error("Usage: ./fetchPositionFromNFT.js <NFT ID>");
    process.exit(1);
}

const nftId = process.argv[2];
fetchPositionFromNFT(nftId);
