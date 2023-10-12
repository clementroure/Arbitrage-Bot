// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IntermediaryArbitrageStep.sol";

struct Step {
    address intermediary;
    address token;
    address data;
}
