import { ethers, network } from "hardhat";

async function main() {
    // Define wallet from Hardhat Runtime Environment configuration
    const provider = new ethers.providers.JsonRpcProvider(process.env.HTTP_JSON_RPC_URL);
    console.log("Network:", network.name);
    console.log("URL:", process.env.HTTP_JSON_RPC_URL);
    const wallet = new ethers.Wallet(network.config.accounts[0], provider);
    console.log("Deploying contracts with the account:", wallet.address);

    // Set the gas price to 50 Gwei
    const gasPrice = ethers.utils.parseUnits("20", "gwei");

    // Deploy SwapRouteCoordinator
    const SwapRouteCoordinator = await ethers.getContractFactory(
        "SwapRouteCoordinator",
        wallet
    );
    console.log("Deploying SwapRouteCoordinator...");
    const swapRouteCoordinator = await SwapRouteCoordinator.deploy({
        gasPrice,
        gasLimit: 2000000,
    });
    console.log("Sent SwapRouteCoordinator to network...");
    await swapRouteCoordinator.deployed();
    console.log(
        "SwapRouteCoordinator deployed to:",
        swapRouteCoordinator.address
    );

    // Deploy ArbitrageUniswapV2
    const ArbitrageUniswapV2 = await ethers.getContractFactory(
        "ArbitrageUniswapV2",
        wallet
    );
    const arbitrageUniswapV2 = await ArbitrageUniswapV2.deploy({
        gasPrice,
        gasLimit: 2500000,
    });
    await arbitrageUniswapV2.deployed();
    console.log("ArbitrageUniswapV2 deployed to:", arbitrageUniswapV2.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
