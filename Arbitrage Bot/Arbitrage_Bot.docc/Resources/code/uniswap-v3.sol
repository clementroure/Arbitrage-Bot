// SPDX-License-Identifier: MIT
pragma solidity =0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "./IntermediaryArbitrageStep.sol";

contract UniswapV3Step is IntermediaryArbitrageStep {
    ISwapRouter public immutable router;

    constructor(ISwapRouter _router) {
        router = _router;
    }

    struct Params {
        uint160 sqrtPriceLimitX96;
    }

    function prepareStep(
        address coordinator,
        address tokenA,
        address tokenB,
        uint256 amount,
        address data
    ) external override returns (address contractToCall, bytes memory callData) {
        Params memory params = Params(0);

        bytes memory encodedCallData = abi.encodeWithSelector(
            router.exactInputSingle.selector,
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenA,
                tokenOut: tokenB,
                fee: 3000,
                recipient: coordinator,
                deadline: block.timestamp + 1800, // 30 minutes
                amountIn: amount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: params.sqrtPriceLimitX96
            })
        );

        return (address(router), encodedCallData);
    }
}
