import MerkleTree from "./merkle-tree";
import { ethers } from "ethers";

export default class ClaimsTree {
  private readonly tree: MerkleTree;
  constructor(allocations: { account: string; prizeValue: bigint }[]) {
    this.tree = new MerkleTree(
      allocations.map(({ account, prizeValue }, index) => {
        return ClaimsTree.toNode(index, account, prizeValue);
      })
    );
  }

  public static verifyProof(
    index: number | bigint,
    account: string,
    prizeValue: bigint,
    proof: Buffer[],
    root: Buffer
  ): boolean {
    let pair = ClaimsTree.toNode(index, account, prizeValue);
    for (const item of proof) {
      pair = MerkleTree.combinedHash(pair, item);
    }

    return pair.equals(root);
  }

  // keccak256(abi.encode(index, account, amount))
  public static toNode(
    index: number | BigInt,
    account: string,
    prizeValue: bigint
  ): Buffer {
    return Buffer.from(
      ethers
        .solidityPackedKeccak256(
          ["uint256", "address", "uint256"],
          [index, account, prizeValue]
        )
        .substr(2),
      "hex"
    );
  }

  public getHexRoot(): string {
    return this.tree.getHexRoot();
  }

  // returns the hex bytes32 values of the proof
  public getProof(
    index: number | BigInt,
    account: string,
    prizeValue: bigint
  ): string[] {
    return this.tree.getHexProof(ClaimsTree.toNode(index, account, prizeValue));
  }
}
