import { TransactionReceipt, TransactionResponse } from "ethers";

// console.log = function () {};

export enum ClaimsState {
  DISABLED,
  ENABLED,
}

/**
 * Helper to get the events from the transaction
 * @param txn
 */
export const getEvents = async (txn: TransactionResponse) => {
  const receipt: TransactionReceipt | null = await txn.wait();
  if (receipt) {
    // console.log("result transaction => ", receipt);
    receipt.logs.forEach((log) => {
      console.log("logs transaction => ", log);
    });
    console.log("logs transaction counter => ", receipt.logs.length);
    console.log("sended to => ", receipt.to);
  } else {
    throw new Error("cant get the transaction receipt");
  }
};
