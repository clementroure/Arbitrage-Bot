// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Step.sol";

interface LapExchangeInterface {
    /// @notice Initializes the exchange
    /// @dev This function should be called by the coordinator contract, it will initialize the flash swap, and re-route the call to the coordinator for performing the arbitrage. It also handles the repayments.
    /// @param amount The amount of tokenA to start with
    /// @param intermediaries The addresses of the intermediary contracts
    /// @param tokens The addresses of the tokens to swap through
    /// @param data The data to pass to the intermediary contracts
    /// @return contractToCall The address of the contract to call
    /// @return callData The data to call the contract with
    function initialize(
        uint256 amount,
        address[] calldata intermediaries,
        address[] calldata tokens,
        address[] calldata data
    ) external returns (address contractToCall, bytes memory callData);
}
