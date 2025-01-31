// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface GiveawayClaimInterface {
    event ProceedsWithdrawn(address indexed receiver, uint256 amount);
    event ContractInitialized();
    event PrizeClaimed(address indexed winner, uint256 amount);
    event ClaimsActivated(); 
    event FundsReceived(address indexed from, uint256 amount); // admin deposited

    error InvalidProof();
    error ClaimsNotActive();
    error WithdrawalFailed();
    error ClaimTransferFailed();
    error InsufficientContractBalance();
    error InvalidAddress(address account);
    error AccessDenied();
    error PrizeAlreadyClaimed();
}
