// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { SecureOApp } from "../../../contracts/src/SecureOApp.sol";

/// Example OFT that inherits SecureOApp. In a real deployment you would
/// combine this with a LayerZero OFT base class from the LZ monorepo;
/// here we keep the example minimal to exercise the enforcement surface.
contract StandardOFT is SecureOApp {
    string public name;
    string public symbol;

    constructor(
        address endpoint,
        address registry,
        bytes32 profileId,
        address admin,
        string memory name_,
        string memory symbol_
    ) SecureOApp(endpoint, registry, profileId, admin) {
        name = name_;
        symbol = symbol_;
    }
}
