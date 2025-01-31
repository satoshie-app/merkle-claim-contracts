// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/GiveawayClaimInterface.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract GiveawayClaim is
    GiveawayClaimInterface,
    ReentrancyGuard,
    AccessControlUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public merkleRoot;
    mapping(address => uint256) public claimsPerAddress; // log claims completed
    uint256 public totalClaims; // Counter for successful claims
    enum ClaimsState {
        DISABLED,
        ENABLED
    }

    ClaimsState public claimsState;

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert AccessDenied();
        _;
    }

    constructor(address admin) {
        if (admin == address(0)) revert InvalidAddress(admin);
        _grantRole(ADMIN_ROLE, admin);
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        emit ContractInitialized();
    }

    function setEnabled(bool _active) public onlyAdmin {
        claimsState = _active ? ClaimsState.ENABLED : ClaimsState.DISABLED;
        emit ClaimsActivated();
    }

    function setMerkleRoot(bytes32 _merkleRoot) public onlyAdmin {
        if (claimsState != ClaimsState.ENABLED) revert ClaimsNotActive();
        merkleRoot = _merkleRoot;
        emit ClaimsActivated();
    }

    function claimPrize(
        bytes calldata data,
        bytes32[] calldata merkleProof
    ) public nonReentrant {
        if (claimsState != ClaimsState.ENABLED) revert ClaimsNotActive();

        (uint256 index, uint256 prizeValue) = abi.decode(
            data,
            (uint256, uint256)
        );

        if (claimsPerAddress[msg.sender] > 0) revert PrizeAlreadyClaimed();

        bytes32 node = keccak256(
            abi.encodePacked(index, msg.sender, prizeValue)
        );
        if (!MerkleProof.verify(merkleProof, merkleRoot, node))
            revert InvalidProof();

        claimsPerAddress[msg.sender] = prizeValue;
        totalClaims += 1;

        if (address(this).balance < prizeValue)
            revert InsufficientContractBalance();

        (bool success, ) = msg.sender.call{value: prizeValue}("");
        if (!success) revert ClaimTransferFailed();

        emit PrizeClaimed(msg.sender, prizeValue);
    }

    function withdrawProceeds() public onlyAdmin {
        uint256 amount = address(this).balance;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        if (!sent) revert WithdrawalFailed();
        claimsState = ClaimsState.DISABLED;
        emit ProceedsWithdrawn(msg.sender, amount);
    }

    /// Allow the contract to receive ETH
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    /// Fallback function for non-standard calls
    fallback() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
}
