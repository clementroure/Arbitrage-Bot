// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./IntermediaryArbitrageStep.sol";
import "./LapExchangeInterface.sol";
import "./Step.sol";

import "hardhat/console.sol";

contract SwapRouteCoordinator {
    using SafeMath for uint256;

    event Arbitrage(uint256 amountOut);
    event SwapPerformed(address indexed intermediary, uint256 amountOut);
    event TokensRepaid(address indexed destination, uint256 amount);

    uint256 constant MINIMUM_STEPS = 3;

    function initiateArbitrage(
        uint256 startAmount,
        address lapExchange,
        address[] memory intermediaries,
        address[] memory tokens,
        address[] memory data
    ) public returns (uint256 amountOut) {
        // validate non-zero addresses
        require(lapExchange != address(0), "Invalid LapExchange address.");
        require(
            intermediaries.length == tokens.length &&
                tokens.length == data.length,
            "Input arrays length mismatch"
        );

        for (uint i = 0; i < intermediaries.length; i++) {
            require(
                intermediaries[i] != address(0),
                "Invalid intermediary address"
            );
            require(tokens[i] != address(0), "Invalid token address");
            // validate data addresses here as needed
        }

        // Call startArbitrage with constructed steps array
        amountOut = startArbitrage(
            startAmount,
            lapExchange,
            intermediaries,
            tokens,
            data
        );

        emit Arbitrage(amountOut);

        // Send back the tokens to the user
        IERC20 lastToken = IERC20(tokens[tokens.length - 1]);
        lastToken.transfer(msg.sender, amountOut);
    }

    function startArbitrage(
        uint256 startAmount,
        address lapExchange,
        address[] memory intermediaries,
        address[] memory tokens,
        address[] memory data
    ) private returns (uint256 amountOut) {
        require(
            intermediaries.length >= MINIMUM_STEPS,
            "Must have at least 3 steps"
        );

        (address contractToCall, bytes memory callData) = LapExchangeInterface(
            lapExchange
        ).initialize(startAmount, intermediaries, tokens, data);

        console.log("contractToCall: %s", contractToCall);

        // Perform swap
        IERC20 token = IERC20(tokens[0]);
        token.approve(contractToCall, startAmount);
        (bool success, ) = contractToCall.call(callData);

        require(success, "Swap operation failed");

        // Return amount of tokenB received
        IERC20 lastToken = IERC20(tokens[tokens.length - 1]);
        amountOut = lastToken.balanceOf(address(this));
    }

    function performArbitrage(
        address[] memory intermediaries,
        address[] memory tokens,
        address[] memory data
    ) public {
        for (uint i = 1; i < tokens.length - 1; i++) {
            uint256 amount = IERC20(tokens[i]).balanceOf(address(this)); // Get current balance of token, this way we can use any token as input
            console.log("Balance: %s %s", amount, tokens[i]);
            // Prepare call data based on current step
            (
                address contractToCall,
                bytes memory callData
            ) = IntermediaryArbitrageStep(intermediaries[i]).prepareStep(
                    address(this),
                    tokens[i],
                    tokens[i + 1],
                    amount,
                    data[i]
                );

            // Perform swap
            IERC20(tokens[i]).approve(contractToCall, amount);
            console.log(
                "Allowance: %s",
                IERC20(tokens[i]).allowance(address(this), contractToCall)
            );
            console.log("contractToCall: %s", contractToCall);

            (bool success, ) = contractToCall.call(callData);

            address[] memory path = new address[](2);
            path[0] = tokens[i];
            path[1] = tokens[i + 1];

            require(success, "Inter-Swap operation failed");

            IERC20 nextToken = IERC20(tokens[i + 1]);
            uint256 nextTokenBalance = nextToken.balanceOf(address(this));
            console.log("Swapped! New balance: %s", nextTokenBalance);

            emit SwapPerformed(intermediaries[i + 1], nextTokenBalance);
        }
    }

    function repay(address token, uint256 amount, address destination) public {
        require(token != address(0), "Invalid token address");
        require(destination != address(0), "Invalid destination address");
        IERC20 tokenInstance = IERC20(token);
        // Boolean check for transfer
        require(tokenInstance.transfer(destination, amount), "Transfer failed");

        emit TokensRepaid(destination, amount);
    }
}
