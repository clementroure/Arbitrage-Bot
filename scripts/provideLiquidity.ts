import { ethers } from "ethers";
import { createPrompt } from "bun-promptx";
// Define contract interfaces
const IERC20 = new ethers.utils.Interface([
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function safeMint(uint256 amount) external",
    "function decimals() external view returns (uint8)",
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
]);
const IUniswapV2Factory = new ethers.utils.Interface([
    "function getPair(address tokenA, address tokenB) external view returns (address pair)",
    "function createPair(address tokenA, address tokenB) external returns (address pair)",
]);
const IUniswapV2Router02 = new ethers.utils.Interface([
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
    "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function factory() external view returns (address)",
]);

// Define contract addresses
const WETH_ADDRESS = "0x272473bFB0C70e7316Ec04cFbae03EB3571A8D8F";

async function main() {
    // Connect to provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(
        "https://data-seed-prebsc-1-s1.binance.org:8545"
    );
    const signer = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);

    // Get token addresses
    const tokenAAddress = createPrompt("Enter token A address:").value;
    const tokenBAddress = createPrompt("Enter token B address:").value;

    if (!tokenAAddress || !tokenBAddress) {
        console.log("Token addresses are required");
        return;
    }

    // Get router addresses
    const routerAddresses: string[] = [];
    while (true) {
        const routerAddress = createPrompt(
            `Enter DEX ${routerAddresses.length + 1} router address:`
        ).value;
        if (routerAddress) routerAddresses.push(routerAddress);
        const addAnother =
            createPrompt("Add another DEX? (y/n)").value?.toLowerCase() === "y";
        if (!addAnother) break;
    }

    // Fetch factories and check if pairs exist, create if not
    const pairs: string[] = [];
    for (const routerAddress of routerAddresses) {
        const router = new ethers.Contract(
            routerAddress,
            IUniswapV2Router02,
            signer
        );
        const factoryAddress = await router.factory();
        const factory = new ethers.Contract(
            factoryAddress,
            IUniswapV2Factory,
            signer
        );

        let pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
        if (pairAddress === ethers.constants.AddressZero) {
            const tx = await factory.createPair(tokenAAddress, tokenBAddress);
            await tx.wait();
            pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
        }
        pairs.push(pairAddress);
    }

    // Get amounts of token A and token B to provide
    const amountA = createPrompt("Enter amount of token A to provide:").value;
    const amountB = createPrompt("Enter amount of token B to provide:").value;

    if (!amountA || !amountB) {
        console.log("Amounts are required");
        return;
    }

    // Add liquidity and print new reserves
    for (const [index, pairAddress] of pairs.entries()) {
        const routerAddress = routerAddresses[index];
        const router = new ethers.Contract(
            routerAddress,
            IUniswapV2Router02,
            signer
        );

        const tokenA = new ethers.Contract(tokenAAddress, IERC20, signer);
        const tokenB = new ethers.Contract(tokenBAddress, IERC20, signer);

        const decimalsA = await tokenA.decimals();
        const decimalsB = await tokenB.decimals();

        const adjustedAmountA = ethers.utils.parseUnits(amountA, decimalsA);
        const adjustedAmountB = ethers.utils.parseUnits(amountB, decimalsB);

        // Check if the user has enough tokens, if not, mint the required amount
        const userAddress = await signer.getAddress();
        const balanceA = await tokenA.balanceOf(userAddress);
        const balanceB = await tokenB.balanceOf(userAddress);

        if (balanceA.lt(adjustedAmountA)) {
            const amountToMintA = adjustedAmountA.sub(balanceA);
            try {
                console.log(
                    `Minting ${amountToMintA} token A to address ${userAddress}`
                );
                const mint = await tokenA.safeMint(amountToMintA, {
                    gasLimit: 1000000,
                });
                await mint.wait();
            } catch (error) {
                console.error(`Failed to mint token A: ${error.message}`);
                process.exit(1);
            }
        }

        if (balanceB.lt(adjustedAmountB)) {
            const amountToMintB = adjustedAmountB.sub(balanceB);
            try {
                console.log(
                    `Minting ${amountToMintB} token B to address ${userAddress}`
                );
                const mint = await tokenB.safeMint(amountToMintB, {
                    gasLimit: 1000000,
                });
                await mint.wait();
            } catch (error) {
                console.error(`Failed to mint token B: ${error.message}`);
                process.exit(1);
            }
        }

        const tx1 = await tokenA.approve(routerAddress, adjustedAmountA, {
            gasLimit: 1000000,
            gasPrice: 100000000000,
        });
        await tx1.wait();
        const tx2 = await tokenB.approve(routerAddress, adjustedAmountB, {
            gasLimit: 1000000,
            gasPrice: 100000000000,
        });
        await tx2.wait();

        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
        const tx = await router.addLiquidity(
            tokenAAddress,
            tokenBAddress,
            adjustedAmountA,
            adjustedAmountB,
            0,
            0,
            await signer.getAddress(),
            deadline,
            { gasLimit: 1000000, gasPrice: 100000000000 }
        );
        console.log(`Adding liquidity to DEX ${index + 1}...`);
        await tx.wait();

        const pair = new ethers.Contract(pairAddress, IERC20, signer);
        const reserves = await pair.getReserves();
        console.log(
            `New reserves for DEX ${
                index + 1
            }: ${reserves.reserve0.toString()}, ${reserves.reserve1.toString()}`
        );
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
