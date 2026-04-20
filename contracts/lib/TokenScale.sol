// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import "@openzeppelin/contracts/utils/math/Math.sol";

/// @dev Helpers to convert between raw ERC-20 amounts and 18-decimal fixed-point (wad) values.
library TokenScale {
    /// @dev Converts a raw token amount to 18-decimal wad using `decimals`.
    function to18(uint256 amount, uint8 decimals) internal pure returns (uint256) {
        if (decimals == 18) return amount;
        if (decimals < 18) {
            return Math.mulDiv(amount, 10 ** (18 - decimals), 1);
        }
        return amount / (10 ** (decimals - 18));
    }

    /// @dev Converts a wad amount to raw token units for `decimals`.
    function from18(uint256 wad, uint8 decimals) internal pure returns (uint256) {
        if (decimals == 18) return wad;
        if (decimals < 18) {
            return Math.mulDiv(wad, 1, 10 ** (18 - decimals));
        }
        return Math.mulDiv(wad, 10 ** (decimals - 18), 1);
    }
}
