// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;

import "./SwapRouteCoordinator.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./IntermediaryArbitrageStep.sol";
import "./LapExchangeInterface.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

import "hardhat/console.sol";

interface IUniswapV2SpecialFactory {
    function INIT_CODE_PAIR_HASH() external view returns (bytes32);
}

contract ArbitrageUniswapV2 is
    IntermediaryArbitrageStep,
    LapExchangeInterface,
    IUniswapV2Callee
{
    constructor() public {}

    // MARK: - IntermediaryArbitrageStep
    function prepareStep(
        address coordinator,
        address tokenA,
        address tokenB,
        uint256 amount,
        address data
    )
        external
        override
        returns (address contractToCall, bytes memory callData)
    {
        address router = data;

        contractToCall = router;

        address[] memory path = new address[](2);
        path[0] = tokenA;
        path[1] = tokenB;

        console.log("Swapping %s %s for %s", amount, tokenA, tokenB);

        // Call swapExactTokensForTokens
        callData = abi.encodeWithSelector(
            IUniswapV2Router01.swapExactTokensForTokens.selector,
            amount,
            0, // Accept any amount of output tokens
            path,
            coordinator,
            block.timestamp
        );
    }

    // MARK: - LapExchangeInterface
    function initialize(
        uint256 amount,
        address[] calldata intermediaries,
        address[] calldata tokens,
        address[] calldata data
    )
        external
        override
        returns (address contractToCall, bytes memory callData)
    {
        // Get amounts
        (
            address pair,
            uint amount0,
            uint amount1,
            uint amountToRepay
        ) = getAmounts(data[0], amount, tokens[0], tokens[1]);

        contractToCall = pair;

        // Encode Steps[], coordinator and amountToRepay
        bytes memory passdata = abi.encode(
            intermediaries,
            tokens,
            data,
            amountToRepay
        );

        console.log("Amount to repay: %s", amountToRepay);

        callData = abi.encodeWithSelector(
            IUniswapV2Pair.swap.selector,
            amount0,
            amount1,
            address(this), // To this contract, which implements IUniswapV2Callee
            passdata
        );
    }

    // MARK: - IUniswapV2Callee
    function uniswapV2Call(
        address sender,
        uint amount0,
        uint amount1,
        bytes calldata data
    ) external override {
        // Decode data
        (
            address[] memory intermediaries,
            address[] memory tokens,
            address[] memory interdata,
            uint amountToRepay
        ) = abi.decode(data, (address[], address[], address[], uint));

        // Send tokens to SwapRouteCoordinator
        uint amountReceived = amount0 > 0 ? amount0 : amount1; // Whichever is greater, since one will be 0
        console.log(
            "Token 1 balance: %s",
            IERC20(tokens[1]).balanceOf(address(this))
        );
        IERC20(tokens[1]).transfer(sender, amountReceived);

        console.log("Transfered %s to %s", amountReceived, sender);

        SwapRouteCoordinator(sender).performArbitrage(
            intermediaries,
            tokens,
            interdata
        );
        // Repay the flash loan
        try
            SwapRouteCoordinator(sender).repay(
                tokens[0],
                amountToRepay,
                msg.sender
            )
        {
            console.log("Repayed %s to %s", amountToRepay, msg.sender);
        } catch Error(string memory reason) {
            console.log("Repay failed: %s", reason);
        }
    }

    // MARK: - Helpers
    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(
        address factory,
        address tokenA,
        address tokenB,
        bytes32 codeHash
    ) internal pure returns (address pair) {
        (address token0, address token1) = UniswapV2Library.sortTokens(
            tokenA,
            tokenB
        );
        pair = address(
            uint(
                keccak256(
                    abi.encodePacked(
                        hex"ff",
                        factory,
                        keccak256(abi.encodePacked(token0, token1)),
                        codeHash // init code hash
                    )
                )
            )
        );
    }

    function getAmounts(
        address router,
        uint amount,
        address tokenA,
        address tokenB
    )
        internal
        view
        returns (address pair, uint amount0, uint amount1, uint amountToRepay)
    {
        console.log("Router: %s", router);
        address factory = IUniswapV2Router02(router).factory();
        // INIT_CODE_PAIR_HASH sometimes exists, sometimes doesn't
        bytes32 initCodePairHash = initCodePairHashDetection(factory);
        pair = pairFor(factory, tokenA, tokenB, initCodePairHash);

        require(pair != address(0), "LapExchange: PAIR_NOT_FOUND");

        address[] memory path = new address[](2);
        path[0] = tokenA;
        path[1] = tokenB; // We're borrowing tokenB

        uint[] memory amounts = UniswapV2Library.getAmountsOut(
            factory,
            amount,
            path
        );

        amount0 = tokenA > tokenB ? amounts[1] : 0;
        amount1 = tokenA > tokenB ? 0 : amounts[1];

        // Calculate amount to repay
        amountToRepay = amounts[0];
    }

    function initCodePairHashDetection(
        address factory
    ) internal view returns (bytes32 initCodePairHash) {
        // bytes memory toCall = abi.encodeWithSelector(
        //     IUniswapV2SpecialFactory.INIT_CODE_PAIR_HASH.selector
        // );

        // (bool success, bytes memory returndata) = factory.staticcall(toCall);

        // if (success) {
        //     initCodePairHash = abi.decode(returndata, (bytes32));
        // } else {
        initCodePairHash = bytes32(
            0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f
        );
        // }
    }
}
