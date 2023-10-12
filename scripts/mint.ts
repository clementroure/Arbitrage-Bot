import { ethers } from "ethers";
import { createPrompt } from "bun-promptx";

// Define contract interface
const ITokenX = new ethers.utils.Interface([
    "function safeMint(uint256 amount) external",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string memory)",
    "function balanceOf(address account) external view returns (uint256)",
]);

async function main() {
    // Connect to provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(
        "https://data-seed-prebsc-1-s1.binance.org:8545"
    );
    const signer = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);

    // Get token address and amount to mint
    const tokenXAddress = createPrompt("Enter token X address:").value;
    if (!tokenXAddress) {
        console.log("Token address is required");
        return;
    }
    // Get and display balance before minting
    const tokenX = new ethers.Contract(tokenXAddress, ITokenX, signer);
    const balanceBefore = await tokenX.balanceOf(signer.address);
    const symbol = await tokenX.symbol();
    console.log(
        `Balance before minting: ${balanceBefore.toString()} ${symbol}`
    );

    const amountToMint = createPrompt("Enter amount of token X to mint:").value;

    if (!tokenXAddress || !amountToMint) {
        console.log("Token address and amount to mint are required");
        return;
    }

    const decimals = await tokenX.decimals();
    const amountToMintWithDecimals = ethers.utils.parseUnits(
        amountToMint,
        decimals
    );

    try {
        console.log(
            `Minting ${amountToMint} token X to address ${signer.address}`
        );
        const mint = await tokenX.safeMint(amountToMintWithDecimals, {
            gasLimit: 1000000,
        });
        await mint.wait();
    } catch (error) {
        console.error(`Failed to mint token X: ${error.message}`);
        process.exit(1);
    }

    // Get and display balance after minting
    const balanceAfter = await tokenX.balanceOf(signer.address);
    console.log(`Balance after minting: ${balanceAfter.toString()}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
