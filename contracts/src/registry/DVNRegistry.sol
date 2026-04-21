// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { IDVNRegistry, DVNTag } from "./IDVNRegistry.sol";

/// @notice Canonical operator identifiers. Shared across chains.
library DVNOperators {
    bytes32 internal constant LAYERZERO = keccak256("layerzero-labs");
    bytes32 internal constant POLYHEDRA = keccak256("polyhedra");
    bytes32 internal constant SUCCINCT = keccak256("succinct");
    bytes32 internal constant NETHERMIND = keccak256("nethermind");
    bytes32 internal constant GOOGLE_CLOUD = keccak256("google-cloud");
    bytes32 internal constant ANIMOCA = keccak256("animoca");
    bytes32 internal constant HORIZEN = keccak256("horizen-labs");
    bytes32 internal constant STARGATE = keccak256("stargate");
}

/// @notice Minimal on-chain DVN registry. Per-chain deployment. The owner
///         curates entries; DVN set additions should be PRs backed by the
///         operator's published DVN address announcement.
/// @dev Intentionally simple — we do not implement delegated governance,
///      staking, or slashing. The registry is a shared trust anchor, not a
///      market. For v0.1 we optimize for auditability: every entry is
///      explicitly added, every tag is a matter of public record.
contract DVNRegistry is IDVNRegistry {
    event DVNRegistered(address indexed dvn, bytes32 operator, bool isZk);
    event DVNRemoved(address indexed dvn);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error ZeroAddress();
    error AlreadyRegistered(address dvn);

    address public owner;
    mapping(address => DVNTag) private _tags;
    mapping(address => bool) private _registered;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function tagOf(address dvn) external view returns (DVNTag memory) {
        if (!_registered[dvn]) revert UnknownDVN(dvn);
        return _tags[dvn];
    }

    function isRegistered(address dvn) external view returns (bool) {
        return _registered[dvn];
    }

    function register(address dvn, bytes32 operator, bool isZk) external onlyOwner {
        if (dvn == address(0)) revert ZeroAddress();
        if (_registered[dvn]) revert AlreadyRegistered(dvn);
        _tags[dvn] = DVNTag({ operator: operator, isZk: isZk, verified: true });
        _registered[dvn] = true;
        emit DVNRegistered(dvn, operator, isZk);
    }

    function registerBatch(address[] calldata dvns, bytes32[] calldata operators, bool[] calldata isZkFlags)
        external
        onlyOwner
    {
        uint256 n = dvns.length;
        require(operators.length == n && isZkFlags.length == n, "length mismatch");
        for (uint256 i; i < n; ++i) {
            address dvn = dvns[i];
            if (dvn == address(0)) revert ZeroAddress();
            if (_registered[dvn]) revert AlreadyRegistered(dvn);
            _tags[dvn] = DVNTag({ operator: operators[i], isZk: isZkFlags[i], verified: true });
            _registered[dvn] = true;
            emit DVNRegistered(dvn, operators[i], isZkFlags[i]);
        }
    }

    function remove(address dvn) external onlyOwner {
        if (!_registered[dvn]) revert UnknownDVN(dvn);
        delete _tags[dvn];
        _registered[dvn] = false;
        emit DVNRemoved(dvn);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
