import { ethers, BigNumberish, BigNumber } from "ethers";

// Constants
// const FACTORY_ADDRESS = "0xADf1687e201d1DCb466D902F350499D008811e84";
// const ROUTER_ADDRESS = "0xF76921660f6fcDb161A59c77d5daE6Be5ae89D20";
const FACTORY_ADDRESS = "0x5722F3b02b9fe2003b3045D73E9230684707B257";
const ROUTER_ADDRESS = "0x1c6f40e550421D4307f9D5a878a1628c50be0C5B";
const USDT_ADDRESS = "0x0a1B8D7450F69d33803e8b084aBA9d2F858f6574";
const WETH_ADDRESS = "0x272473bFB0C70e7316Ec04cFbae03EB3571A8D8F";

// ABI for Uniswap V2 Router and Factory
const ROUTER_ABI = [
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
    "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
];

const FACTORY_ABI = [
    "function getPair(address tokenA, address tokenB) external view returns (address pair)",
    "function createPair(address tokenA, address tokenB) external returns (address pair)",
];

// ABI for ERC20 and Uniswap V2 Pair
const ERC20_ABI = [
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
];

const PAIR_ABI = [
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function totalSupply() external view returns (uint256)",
];

// Connect to provider and wallet
const provider = new ethers.providers.JsonRpcProvider(
    "https://data-seed-prebsc-1-s1.binance.org:8545"
);
const wallet = new ethers.Wallet(
    process.env.PROVIDER_WALLET_PRIVATE_KEY,
    provider
);

// Create contract instances
const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, wallet);
const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, wallet);

async function checkContractExistence(contractAddress) {
    const code = await provider.getCode(contractAddress);
    return code !== "0x";
}

async function getCurrentPrice(log: boolean = false): Promise<number> {
    const pairAddress = await factory.getPair(USDT_ADDRESS, WETH_ADDRESS);

    if (!(await checkContractExistence(pairAddress))) {
        console.log("Pair does not exist");
        // Create pair
        // Approve USDT to be spent by the factory
        await approveIfNeeded(
            usdt,
            FACTORY_ADDRESS,
            ethers.constants.MaxUint256
        );
        // Approve WETH to be spent by the factory
        await approveIfNeeded(
            weth,
            FACTORY_ADDRESS,
            ethers.constants.MaxUint256
        );
        // Create pair
        const tx = await factory.createPair(USDT_ADDRESS, WETH_ADDRESS, {
            gasLimit: 5000000,
        });
        await tx.wait();
        console.log("Pair created at address: ", pairAddress);
        return 0;
    }

    const pair = new ethers.Contract(pairAddress, PAIR_ABI, wallet);
    const { reserve0, reserve1 } = await pair.getReserves();
    if (log) {
        console.log(`Reserve0: ${ethers.utils.formatUnits(reserve0, 18)}`);
        console.log(`Reserve1: ${ethers.utils.formatUnits(reserve1, 18)}`);
    }
    const currentPrice =
        parseFloat(ethers.utils.formatUnits(reserve0, 18)) /
        parseFloat(ethers.utils.formatUnits(reserve1, 18));
    return currentPrice;
}

async function approveIfNeeded(
    contract: ethers.Contract,
    spender: string,
    amount: BigNumberish
) {
    const allowance = await contract.allowance(wallet.address, spender);
    if (allowance.lt(amount)) {
        const tx = await contract.approve(spender, amount);
        await tx.wait();
        console.log(`Allowed ${spender} to spend ${amount}`);
    }
}

async function performSwapToMatchPrice(
    pair: ethers.Contract,
    desiredPrice: number
) {
    const DEADLINE = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

    const { reserve0, reserve1 } = await pair.getReserves();
    const reserve0Big = BigNumber.from(reserve0);
    const reserve1Big = BigNumber.from(reserve1);
    const desiredPriceBig = BigNumber.from(Math.floor(desiredPrice * 1e6)).mul(
        BigNumber.from(10).pow(12)
    );

    const inputAmount = reserve0Big
        .mul(BigNumber.from(10).pow(18))
        .div(desiredPriceBig)
        .sub(reserve1Big);

    await approveIfNeeded(usdt, ROUTER_ADDRESS, inputAmount);

    const tx = await router.swapExactTokensForTokens(
        inputAmount,
        0,
        [USDT_ADDRESS, WETH_ADDRESS],
        wallet.address,
        DEADLINE,
        { gasLimit: 1000000 }
    );

    const receipt = await tx.wait();

    console.log(
        `Performed swap to match desired price, view on BSCScan: https://testnet.bscscan.com/tx/${receipt.transactionHash}`
    );

    const newPrice = await getCurrentPrice(true);
    console.log(`New price after performing swap: ${newPrice}`);
}

async function adjustLiquidityToMatch(desiredPrice: number) {
    const DEADLINE = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

    const pairAddress = await factory.getPair(USDT_ADDRESS, WETH_ADDRESS);
    const pair = new ethers.Contract(pairAddress, PAIR_ABI, wallet);

    const amountWETH = BigNumber.from(100).mul(BigNumber.from(10).pow(18));
    const amountUSDT = amountWETH
        .mul(
            BigNumber.from(Math.floor(desiredPrice * 1e6)).mul(
                BigNumber.from(10).pow(12)
            )
        )
        .div(BigNumber.from(10).pow(18));

    console.log(`Preparing to add liquidity:`);
    console.log(
        `Amount WETH: ${ethers.utils.formatUnits(
            amountWETH,
            18
        )} WETH and Amount USDT: ${ethers.utils.formatUnits(
            amountUSDT,
            18
        )} USDT`
    );

    const liquidity = await pair.balanceOf(wallet.address);

    // Approve router to remove liquidity
    await pair.approve(ROUTER_ADDRESS, liquidity);

    if (liquidity.gt(BigNumber.from(10).pow(10))) {
        // Remove liquidity
        const tx1 = await router.removeLiquidity(
            USDT_ADDRESS,
            WETH_ADDRESS,
            liquidity,
            0,
            0,
            wallet.address,
            DEADLINE,
            { gasLimit: 1000000 }
        );

        const receipt1 = await tx1.wait();

        console.log(
            `Removed all liquidity, view on BSCScan: https://testnet.bscscan.com/tx/${receipt1.transactionHash}`
        );
        await getCurrentPrice(true);
    }

    // Add liquidity
    await approveIfNeeded(usdt, ROUTER_ADDRESS, amountUSDT);
    await approveIfNeeded(weth, ROUTER_ADDRESS, amountWETH);

    const tx2 = await router.addLiquidity(
        USDT_ADDRESS,
        WETH_ADDRESS,
        amountUSDT,
        amountWETH,
        0,
        0,
        wallet.address,
        DEADLINE,
        { gasLimit: 1000000 }
    );

    const receipt2 = await tx2.wait();

    console.log(
        `Added liquidity, view on BSCScan: https://testnet.bscscan.com/tx/${receipt2.transactionHash}`
    );

    // Swap
    await performSwapToMatchPrice(pair, desiredPrice);

    const newPrice = await getCurrentPrice(true);
    console.log(`New price after adjusting liquidity: ${newPrice}`);
}

async function main() {
    const desiredPrice = parseFloat(process.argv[2]);

    if (!desiredPrice || desiredPrice <= 0) {
        console.error(
            "Error: Please provide a valid desired price as a command line argument."
        );
        process.exit(1);
    }

    const currentPrice = await getCurrentPrice(true);
    console.log(`Current price: ${currentPrice}`);

    await adjustLiquidityToMatch(desiredPrice);
}

if (import.meta.main) {
    main();
}
