// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { ILayerZeroEndpointV2, SetConfigParam } from "../../src/interfaces/ILayerZeroEndpointV2.sol";

contract MockEndpoint is ILayerZeroEndpointV2 {
    address public sendLib;
    address public recvLib;

    struct Call {
        address oapp;
        address lib;
        SetConfigParam[] params;
    }

    Call[] public calls;
    mapping(address => address) public delegateOf;
    mapping(bytes32 => bytes) public stored;

    function setLibraries(address s, address r) external {
        sendLib = s;
        recvLib = r;
    }

    function setConfig(address oapp, address lib, SetConfigParam[] calldata params) external {
        calls.push();
        Call storage c = calls[calls.length - 1];
        c.oapp = oapp;
        c.lib = lib;
        for (uint256 i; i < params.length; ++i) {
            c.params.push(params[i]);
            stored[keccak256(abi.encode(oapp, lib, params[i].eid, params[i].configType))] = params[i].config;
        }
    }

    function getConfig(address oapp, address lib, uint32 eid, uint32 configType)
        external
        view
        returns (bytes memory)
    {
        return stored[keccak256(abi.encode(oapp, lib, eid, configType))];
    }

    function setDelegate(address delegate) external {
        delegateOf[msg.sender] = delegate;
    }

    function delegates(address oapp) external view returns (address) {
        return delegateOf[oapp];
    }

    function getSendLibrary(address, uint32) external view returns (address) {
        return sendLib;
    }

    function getReceiveLibrary(address, uint32) external view returns (address, bool) {
        return (recvLib, false);
    }

    function callCount() external view returns (uint256) {
        return calls.length;
    }
}
