// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// @notice Minimal subset of LayerZero V2's endpoint interface required by
///         SecureOApp. We define it locally to avoid pulling the LZ monorepo
///         as a dependency — the fewer external deps in the enforcement path,
///         the smaller our supply-chain surface area.
struct SetConfigParam {
    uint32 eid;
    uint32 configType;
    bytes config;
}

interface ILayerZeroEndpointV2 {
    function setConfig(address oapp, address lib, SetConfigParam[] calldata params) external;

    function getConfig(address oapp, address lib, uint32 eid, uint32 configType)
        external
        view
        returns (bytes memory);

    function setDelegate(address delegate) external;

    function delegates(address oapp) external view returns (address);

    /// @notice Send library used when `oapp` dispatches messages to `dstEid`.
    function getSendLibrary(address oapp, uint32 dstEid) external view returns (address);

    /// @notice Receive library used when `oapp` receives messages from `srcEid`.
    function getReceiveLibrary(address oapp, uint32 srcEid) external view returns (address, bool);
}
