import { ethers, BigNumber, Contract, Wallet } from "ethers";
import { Exchange, Cost, Token, Receipt } from "./adapters/exchange";
import { Quote } from "./types/Quote";
const IUniswapV2Pair = require("@uniswap/v2-periphery/build/IUniswapV2Pair.json");
const _UniswapV2Factory = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const _UniswapV2Router02 = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const _ArbitrageUniswapV2 = require("../../artifacts/contracts/ArbitrageUniswapV2.sol/ArbitrageUniswapV2.json");

export const hashes = {
    apeswap:
        "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f",
    pancakeswap:
        "0xd0d4c4cd0848c93cb4fd1f498d7013ee6bfb25783ea21593d5834f5d250ece66",
    uniswap:
        "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f",
};

export type UniType = keyof typeof hashes;

export type UniswapV2Exchange = {
    name: UniType;
    routerAddress: string;
    factoryAddress: string;
};

export type RequiredPriceInfo = {
    routerAddress: string;
    factoryAddress: string;
    reserveA: BigNumber;
    reserveB: BigNumber;
};

export class UniswapV2 implements Exchange<Contract, RequiredPriceInfo> {
    name: UniType = "uniswap";
    type: "dex" | "cex" = "dex";

    get fee(): number {
        if (this.name === "apeswap") {
            return 0.003;
        } else if (this.name === "pancakeswap") {
            return 0.0025;
        } else {
            return 0.003;
        }
    }

    /// Router
    delegate: Contract;
    /// Factory
    source: Contract;

    coordinator?: string;

    wallet: Wallet;

    constructor(
        delegate?: Contract | string,
        source?: Contract | string,
        wallet: Wallet = Wallet.createRandom()
    ) {
        if (delegate instanceof Contract) {
            this.delegate = delegate;
        } else {
            const routerAddress =
                delegate ?? "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
            this.delegate = new ethers.Contract(
                routerAddress,
                _UniswapV2Router02.abi,
                wallet
            );
        }
        if (source instanceof Contract) {
            this.source = source;
        } else {
            const factoryAddress =
                source ?? "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
            this.source = new ethers.Contract(
                factoryAddress,
                _UniswapV2Factory.abi,
                wallet
            );
        }
        this.wallet = wallet;
    }

    wethAddress =
        process.env.WETH_CONTRACT_ADDRESS ??
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    normalizeToken(token: Token): Token {
        // Convert ETH to WETH if necessary
        if (token.address === ethers.constants.AddressZero) {
            return {
                name: "WETH",
                address: this.wethAddress,
            };
        }
        return token;
    }

    // MARK: - Smart Contract Methods
    sortTokens(tokenA: string, tokenB: string): [string, string] {
        if (tokenA === tokenB) {
            throw new Error("IDENTICAL_ADDRESSES");
        }
        const [token0, token1] =
            tokenA.toLowerCase() < tokenB.toLowerCase()
                ? [tokenA, tokenB]
                : [tokenB, tokenA];
        if (token0 === ethers.constants.AddressZero) {
            throw new Error("ZERO_ADDRESS");
        }
        return [token0, token1];
    }

    pairFor(factory: string, tokenA: string, tokenB: string): string {
        const [token0, token1] =
            tokenA.toLowerCase() < tokenB.toLowerCase()
                ? [tokenA, tokenB]
                : [tokenB, tokenA];
        const initCodeHash = hashes[this.name] ?? hashes.uniswap;
        const salt = ethers.utils.solidityKeccak256(
            ["address", "address"],
            [token0, token1]
        );
        const bytecode = `0xff${factory.slice(2)}${salt.slice(
            2
        )}${initCodeHash.slice(2)}`;
        const pair = ethers.utils.getAddress(
            `0x${ethers.utils.keccak256(bytecode).slice(-40)}`
        );
        return pair;
    }

    async getReserves(
        factory: string,
        tokenA: string,
        tokenB: string,
        pair?: ethers.Contract
    ): Promise<[BigNumber, BigNumber]> {
        const computedPair = this.pairFor(factory, tokenA, tokenB);
        if (!pair) {
            pair = new ethers.Contract(
                computedPair,
                IUniswapV2Pair.abi,
                this.wallet.provider
            );
        }
        const [reserve0, reserve1] = await pair.getReserves();
        const [token0] = this.sortTokens(tokenA, tokenB);
        return tokenA === token0 ? [reserve0, reserve1] : [reserve1, reserve0];
    }

    getAmountOut(
        amountIn: BigNumber,
        reserveIn: BigNumber,
        reserveOut: BigNumber
    ): BigNumber {
        if (amountIn.lte(0)) {
            throw new Error("INSUFFICIENT_INPUT_AMOUNT");
        }
        if (reserveIn.lte(0) || reserveOut.lte(0)) {
            throw new Error("INSUFFICIENT_LIQUIDITY");
        }
        const amountInWithFee = amountIn.mul(
            this.name === "pancakeswap" || this.name === "apeswap" ? 998 : 997
        );
        const numerator = amountInWithFee.mul(reserveOut);
        const denominator = reserveIn.mul(1000).add(amountInWithFee);
        const amountOut = numerator.div(denominator);
        return amountOut;
    }

    getAmountIn(
        amountOut: BigNumber,
        reserveIn: BigNumber,
        reserveOut: BigNumber
    ): BigNumber {
        if (amountOut.lte(0)) {
            throw new Error("INSUFFICIENT_OUTPUT_AMOUNT");
        }
        if (reserveIn.lte(0) || reserveOut.lte(0)) {
            throw new Error("INSUFFICIENT_LIQUIDITY");
        }
        const numerator = reserveIn.mul(amountOut).mul(1000);
        const denominator = reserveOut.sub(amountOut).mul(997);
        const amountIn = numerator.div(denominator).add(1);
        return amountIn;
    }

    async getQuote(
        maxAvailableAmount: number,
        tokenA: Token,
        tokenB: Token,
        maximizeB: boolean = true,
        meta?: RequiredPriceInfo
    ): Promise<Quote> {
        // Normalize the tokens
        tokenA = this.normalizeToken(tokenA);
        tokenB = this.normalizeToken(tokenB);
        // Get reserves
        let reserveA: BigNumber;
        let reserveB: BigNumber;
        if (meta) {
            [reserveA, reserveB] = [
                BigNumber.from(meta.reserveA),
                BigNumber.from(meta.reserveB),
            ];
        } else {
            [reserveA, reserveB] = await this.getReserves(
                this.source.address,
                tokenA.address,
                tokenB.address
            );
        }
        // // Get the optimal amount In (amountIn = sqrt(k / (1 + fee)))
        // const bestAmountIn = sqrt(
        //     reserveA
        //         .mul(reserveB)
        //         .mul(1000000)
        //         .div(
        //             1000000 +
        //                 (this.name === "pancakeswap" || this.name === "apeswap"
        //                     ? 2500
        //                     : 3000)
        //         )
        // );

        // Amount in is the minimum between the max available amount (in ethers) and the best amount in (in wei)
        const maxAvailableAmountInEther = ethers.utils.parseEther(
            maxAvailableAmount.toString()
        );
        const amountIn = maxAvailableAmountInEther;
        // bestAmountIn.lt(maxAvailableAmountInEther)
        //     ? bestAmountIn
        //     : maxAvailableAmountInEther.eq(0)
        //     ? bestAmountIn
        //     : maxAvailableAmountInEther;

        const _quoteOut = maximizeB
            ? this.getAmountOut(amountIn, reserveA, reserveB)
            : this.getAmountIn(amountIn, reserveB, reserveA);
        // Convert back from wei to ether
        const quoteOut = Number(
            ethers.utils.formatUnits(
                _quoteOut,
                tokenA.address === this.wethAddress ? "mwei" : "ether"
            )
        );

        const amountInEther = Number(ethers.utils.formatEther(amountIn));

        const precision = ethers.BigNumber.from("1000000000000000000"); // 10^18 for 18 decimal places
        const priceBig = reserveB.mul(precision).div(reserveA);

        const price = Number(ethers.utils.formatUnits(priceBig, "ether"));

        // Transaction price would be amountOut / amountIn

        const transactionPrice = maximizeB
            ? quoteOut / amountInEther
            : amountInEther / quoteOut;

        return {
            exchangeType: "uniswap",
            exchangeName: this.name,
            amount: amountInEther,
            amountOut: quoteOut,
            price,
            transactionPrice,
            tokenA,
            tokenB,
            meta: {
                routerAddress: this.delegate.address,
                factoryAddress: this.source.address,
                reserveA: reserveA,
                reserveB: reserveB,
            },
        };
    }

    async estimateTransactionTime(
        tokenA: Token,
        tokenB: Token
    ): Promise<number> {
        // Get the provider
        const provider = this.wallet.provider;

        // // Estimate gas required for the transaction
        // const { gas } = await this.estimateTransactionCost(
        //     1,
        //     0,
        //     tokenA,
        //     tokenB
        // ); // Here the price doesn't matter

        // Get the current block number
        const currentBlockNumber = await provider.getBlockNumber();

        // Get the average block time
        const currentBlock = await provider.getBlock(currentBlockNumber);
        const block = await provider.getBlock(currentBlockNumber - 10); // look back 10 blocks
        const averageBlockTime =
            (currentBlock.timestamp - block.timestamp) / 10;

        // Estimate the time for the transaction to be confirmed

        const estimatedTime = averageBlockTime; // To be improved

        return estimatedTime;
    }

    async estimateTransactionCost(
        amountIn: number,
        price: number,
        tokenA: Token,
        tokenB: Token
    ): Promise<Cost> {
        try {
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
            const address = this.wallet.address;
            const oneETH = ethers.utils.parseEther(amountIn.toString());

            const tokens = [
                this.normalizeToken(tokenA),
                this.normalizeToken(tokenB),
            ];
            const gasEstimate = await this.getGasEstimate(
                tokens as [Token, Token],
                oneETH,
                address,
                deadline,
                amountIn
            );

            const costInDollars = await this.calculateCostInDollars(
                price,
                gasEstimate
            );

            return { costInDollars, gas: gasEstimate };
        } catch (e) {
            const defaultGas = BigNumber.from(21000 * 100);
            const defaultCost = 210 * 100 * 4000 * 10e-9;
            return { costInDollars: defaultCost, gas: defaultGas };
        }
    }

    private async getGasEstimate(
        tokens: [Token, Token],
        oneETH: BigNumber,
        address: string,
        deadline: number,
        amountIn: number
    ): Promise<BigNumber> {
        const [tokenA, tokenB] = tokens;
        let gasEstimate: BigNumber;

        try {
            if (tokenA.address === this.wethAddress) {
                gasEstimate =
                    await this.delegate.estimateGas.swapExactETHForTokens(
                        oneETH,
                        [tokenA.address, tokenB.address],
                        address,
                        deadline,
                        { value: amountIn }
                    );
            } else if (tokenB.address === this.wethAddress) {
                gasEstimate =
                    await this.delegate.estimateGas.swapExactTokensForETH(
                        oneETH,
                        amountIn,
                        [tokenA.address, tokenB.address],
                        address,
                        deadline
                    );
            } else {
                gasEstimate =
                    await this.delegate.estimateGas.swapExactTokensForTokens(
                        oneETH,
                        amountIn,
                        [tokenA.address, tokenB.address],
                        address,
                        deadline
                    );
            }
        } catch (e) {
            gasEstimate = BigNumber.from(21000 * 100);
        }

        return gasEstimate;
    }

    private async calculateCostInDollars(
        price: number,
        gasEstimate: BigNumber
    ): Promise<number> {
        const provider = this.wallet.provider;
        const { maxPriorityFeePerGas } = await provider.getFeeData();
        const gas = gasEstimate.mul(maxPriorityFeePerGas ?? 100);
        return gas.toNumber() * price * 1e-12;
    }

    priceForTokenPair(path: Token[], amountIn: number, amountOut: number) {
        // First, we sort the tokens
        const sortedTokens = this.sortTokens(path[0].address, path[1].address);
        // If path is sorted, then the price is amountOut / amountIn, otherwise it's the opposite
        const price =
            sortedTokens[0] === path[0].address
                ? amountIn / amountOut
                : amountOut / amountIn;
        return price;
    }

    async buyAtMaximumOutput(
        amountIn: number,
        path: Token[],
        to: string,
        deadline: number,
        nonce?: number
    ): Promise<Receipt> {
        console.log(`Transaction on ${this.name} has nonce ${nonce}`);
        // Send the transaction to the delegate contract
        const amount = ethers.utils.parseEther(amountIn.toString());
        const tx = await this.delegate.swapExactTokensForTokens(
            amount,
            0,
            path.map((token) => token.address),
            to,
            deadline,
            { gasLimit: 1000000, nonce }
        );

        const receipt = await tx.wait();

        const transactionHash = receipt.logs[1].transactionHash;
        const amountOutHex = receipt.logs[2].data as string;
        const amountOut = Number(ethers.utils.formatEther(amountOutHex));
        const price = this.priceForTokenPair(path, amountIn, amountOut);

        return {
            amountIn,
            amountOut,
            transactionHash,
            price,
            path,
            exchanges: [this.name],
        };
    }

    async buyAtMinimumInput(
        amountOut: number,
        path: Token[],
        to: string,
        deadline: number,
        nonce?: number
    ): Promise<Receipt> {
        console.log(`Transaction on ${this.name} has nonce ${nonce}`);
        // Send the transaction to the delegate contract
        const amount = ethers.utils.parseEther(amountOut.toString());
        const tx = await this.delegate.swapTokensForExactTokens(
            amount,
            ethers.constants.MaxUint256, // max amount of input token
            path.map((token) => token.address),
            to,
            deadline,
            { gasLimit: 1000000, nonce }
        );

        const receipt = await tx.wait();

        const transactionHash = receipt.transactionHash;
        const amountInHex = receipt.logs[1].data as string;
        const amountIn = Number(ethers.utils.formatEther(amountInHex));
        const price = this.priceForTokenPair(path, amountIn, amountOut);

        return {
            amountIn,
            amountOut,
            transactionHash,
            price,
            path,
            exchanges: [this.name],
        };
    }

    async liquidityFor(token: Token): Promise<number> {
        // Returns the amount of token the wallet has.
        if (token.address === ethers.constants.AddressZero) {
            const balance = await this.wallet.getBalance();
            return Number(ethers.utils.formatEther(balance));
        }
        const contractAbi = [
            "function balanceOf(address) view returns (uint256)",
        ];
        const contract = new ethers.Contract(
            token.address,
            contractAbi,
            this.wallet
        );
        const balance = await contract.balanceOf(this.wallet.address);
        return Number(
            ethers.utils.formatUnits(
                balance,
                token.address === this.wethAddress ? "mwei" : "ether"
            )
        );
    }

    async coordinateFlashSwap(
        exchanges: UniswapV2Exchange[],
        path: Token[],
        amountIn: number
    ): Promise<Receipt> {
        // Notify the Coordinator contract that we want to do a flash swap
        if (!this.coordinator) {
            throw new Error("Coordinator contract not set");
        }

        const coordinator = new ethers.Contract(
            this.coordinator,
            _ArbitrageUniswapV2.abi,
            this.wallet
        );

        // Ok, now we can do the flash swap on our router
        const amount = ethers.utils.parseEther(amountIn.toString());

        const slippageTolerance = 0.001; // 0.1% slippage tolerance

        const factories = exchanges.map((exchange) => exchange.factoryAddress);
        const initCodeHashes = exchanges.map(
            (exchange) => hashes[exchange.name]
        );
        const routers = exchanges.map((exchange) => exchange.routerAddress);

        const factoriesBytes = ethers.utils.defaultAbiCoder.encode(
            ["address[]"],
            [factories]
        );
        const initCodeHashesBytes = ethers.utils.defaultAbiCoder.encode(
            ["uint[]"],
            [initCodeHashes]
        );
        const routersBytes = ethers.utils.defaultAbiCoder.encode(
            ["address[]"],
            [routers]
        );
        const tokenRoutesBytes = ethers.utils.defaultAbiCoder.encode(
            ["address[]"],
            [path.map((token) => token.address)]
        );

        const tx = await coordinator.performRouteSwap(
            factoriesBytes,
            initCodeHashesBytes,
            routersBytes,
            tokenRoutesBytes,
            amount,
            { gasLimit: 1000000 }
        );

        const receipt = await tx.wait();
        const transactionHash = receipt.transactionHash;

        debugger;

        type Log = {
            topics: string[];
            data: string;
        };
        const profitHex = receipt.logs.find(
            (log: Log) =>
                log.topics.length === 3 &&
                ethers.utils.hexStripZeros(log.topics[2]) ===
                this.wallet.address.toLowerCase()
        )?.data;
        const profitOut = Number(ethers.utils.formatEther(profitHex));
        const pairAddress = this.pairFor(
            this.source.address,
            path[0].address,
            path[1].address
        );

        const amountIn1Hex = receipt.logs.find(
            (log: Log) =>
                log.topics.length === 3 &&
                ethers.utils.hexStripZeros(log.topics[2]) ===
                pairAddress.toLowerCase()
        )?.data;

        const amountIn1Receipt = Number(ethers.utils.formatEther(amountIn1Hex));

        return {
            transactionHash,
            amountIn: amountIn1Receipt,
            amountOut: profitOut + amountIn1Receipt,
            price: (profitOut + amountIn1Receipt) / amountIn,
            path,
            exchanges: exchanges.map((exchange) => exchange.name),
        };
    }
}

function sqrt(number: BigNumber): BigNumber {
    const a = number.toBigInt();
    if (a < 0n)
        throw new Error("square root of negative numbers is not supported");
    if (a < 2n) return number;
    function newtonIteration(n: bigint, x0: bigint): bigint {
        const x1 = (n / x0 + x0) >> 1n;
        if (x0 === x1 || x0 === x1 - 1n) return x0;
        return newtonIteration(n, x1);
    }
    return BigNumber.from(newtonIteration(a, 1n));
}
