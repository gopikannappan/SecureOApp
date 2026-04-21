// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { SecureOApp } from "../../src/SecureOApp.sol";

contract MockSecureOApp is SecureOApp {
    constructor(address endpoint_, address registry_, bytes32 profileId_, address admin_)
        SecureOApp(endpoint_, registry_, profileId_, admin_)
    {}
}
