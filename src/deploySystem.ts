import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { deployUniswapV2 } from "./exchanges/deploy/deployUniswapV2";
import { UniswapV2 } from "./exchanges/UniswapV2";

async function deployV2({
    totalLiquidityA = 1000000,
    totalLiquidityB = 1000000,
    liquidityA = 1000000,
    liquidityB = 1000000,
}) {
    await ethers.provider.send("hardhat_reset", []);
    // Deploy Uniswap V2
    const { factory, router, weth } = await deployUniswapV2();

    const uniswapV2 = new UniswapV2(router, factory);

    expect(factory).to.be.ok;
    expect(router).to.be.ok;
    expect(weth).to.be.ok;

    const [deployer] = await ethers.getSigners();

    // Get contracts
    const tokenA = await ethers.getContractFactory("TokenA");
    const tokenB = await ethers.getContractFactory("TokenB");
    const tokenAContract = await tokenA.deploy(
        "TokenA",
        "TKA",
        18,
        totalLiquidityA
    );
    const tokenBContract = await tokenB.deploy(
        "TokenB",
        "TKB",
        18,
        totalLiquidityB
    );
    await tokenAContract.deployed();
    await tokenBContract.deployed();

    console.log("Token A deployed at: ", tokenAContract.address);
    console.log("Token B deployed at: ", tokenBContract.address);

    await tokenAContract.approve(router.address, ethers.constants.MaxUint256);
    await tokenBContract.approve(router.address, ethers.constants.MaxUint256);

    await router
        .connect(deployer)
        .addLiquidity(
            tokenAContract.address,
            tokenBContract.address,
            liquidityA,
            liquidityB,
            0,
            0,
            deployer.address,
            ethers.constants.MaxUint256
        );

    // Check liquidity
    const pairAddress = await factory.getPair(
        tokenAContract.address,
        tokenBContract.address
    );
    const pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress);
    const reserves = await pair.getReserves();
    expect(reserves[0].toString()).to.equal(`${liquidityA}`);
    expect(reserves[1].toString()).to.equal(`${liquidityB}`);
}

deployV2({}).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
