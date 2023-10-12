import { ethers, Contract } from "ethers";
import _UniswapV2Factory from "@uniswap/v2-core/build/UniswapV2Factory.json";
import _UniswapV2Router02 from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import _WETH9 from "@uniswap/v2-periphery/build/WETH9.json";
import dotenv from "dotenv";

export async function deployUniswapV2(deployer: ethers.Wallet): Promise<{
    factory: Contract;
    router: Contract;
    weth: Contract;
}> {
    // const [deployer] = await ethers.getSigners();
    console.log("Deploying Uniswap V2 with the account:", deployer.address);

    const UniswapV2Factory = new ethers.ContractFactory(
        _UniswapV2Factory.abi,
        _UniswapV2Factory.bytecode,
        deployer
    );
    const UniswapV2Router02 = new ethers.ContractFactory(
        _UniswapV2Router02.abi,
        _UniswapV2Router02.bytecode,
        deployer
    );
    const WETH9 = new ethers.ContractFactory(
        _WETH9.abi,
        _WETH9.bytecode,
        deployer
    );

    const factory = await UniswapV2Factory.deploy(deployer.address);
    const weth = await WETH9.deploy();
    const router = await UniswapV2Router02.deploy(
        factory.address,
        weth.address
    );

    console.log("Uniswap V2 Factory deployed at:", factory.address);
    console.log("Uniswap V2 Router deployed at:", router.address);
    console.log("WETH9 deployed at:", weth.address);

    return {
        factory,
        router,
        weth,
    };
}

async function main() {
    dotenv.config();
    const network = process.argv[2];

    let provider, deployer;
    if (network === "bscTestnet") {
        provider = new ethers.providers.JsonRpcProvider(
            "https://data-seed-prebsc-1-s1.binance.org:8545"
        );
        const wallet = new ethers.Wallet(
            process.env.WALLET_PRIVATE_KEY,
            provider
        );
        deployer = wallet;
    } else {
        throw new Error("Network not supported");
    }

    const { factory, router, weth } = await deployUniswapV2(deployer);

    console.log("Uniswap V2 Factory deployed at:", factory.address);
    console.log("Uniswap V2 Router deployed at:", router.address);
    console.log("WETH9 deployed at:", weth.address);
}

// if (import.meta.main) {
//     main()
//         .then(() => process.exit(0))
//         .catch((error) => {
//             console.error(error);
//             process.exit(1);
//         });
// }
