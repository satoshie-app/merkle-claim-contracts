import { expect } from "chai";
import { ethers } from "hardhat";
import ClaimsTree from "../../scripts/claims-tree";
import { User } from "../_helpers/evm";
import { Contracts, setupIntegration } from "../_helpers/evm/index";
import { ClaimsState } from "../_helpers/raffle";

describe("GiveawayClaim", () => {
  let contracts: Contracts;
  let admin: User;
  let users: User[];

  const PRIZE_VALUE: bigint = ethers.parseEther(
    process.env.INDIVIDUAL_PRIZE_AMOUNT as string
  );

  beforeEach(async () => {
    ({ contracts, admin, users } = await setupIntegration());
  });

  describe("Contract Functionality", async function () {
    it("Merkle root should be set correctly", async () => {
      await admin.GiveawayClaim.setEnabled(true);

      const winners = [
        {
          namedUser: users[24],
          account: users[24].address,
          prizeValue: PRIZE_VALUE,
        },
        {
          namedUser: users[9],
          account: users[9].address,
          prizeValue: PRIZE_VALUE,
        },
        {
          namedUser: users[67],
          account: users[67].address,
          prizeValue: PRIZE_VALUE,
        },
      ];

      const tree = new ClaimsTree(winners);
      const merkleRoot = tree.getHexRoot();

      await expect(admin.GiveawayClaim.setMerkleRoot(merkleRoot)).to.emit(
        contracts.GiveawayClaim,
        "ClaimsActivated"
      );

      expect(await contracts.GiveawayClaim.claimsState()).to.equal(
        ClaimsState.ENABLED
      );

      expect(await admin.GiveawayClaim.merkleRoot()).to.equal(merkleRoot);

      expect(await admin.GiveawayClaim.totalClaims()).to.equal(0);

      for (let i = 0; i < winners.length; i++) {
        const winner = winners[i];
        const data = ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint256", "uint256"],
          [i, winner.prizeValue]
        );
        const proof = tree.getProof(i, winner.account, winner.prizeValue);

        await expect(
          winner.namedUser.GiveawayClaim.claimPrize(data, proof)
        ).to.emit(contracts.GiveawayClaim, "PrizeClaimed");

        expect(await admin.GiveawayClaim.totalClaims()).to.equal(i + 1); // incremented by 1 for each claim
      }

      const dodgyIndex = 4;
      const badData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"],
        [dodgyIndex, PRIZE_VALUE]
      );
      const badProof = tree.getProof(0, users[24].address, PRIZE_VALUE);

      // user 24 tries to claim again and fails
      await expect(
        users[24].GiveawayClaim.claimPrize(badData, badProof)
      ).to.be.revertedWithCustomError(
        contracts.GiveawayClaim,
        "PrizeAlreadyClaimed()"
      );

      // user 22 tries to claim with an invalid proof and fails
      await expect(
        users[22].GiveawayClaim.claimPrize(badData, badProof)
      ).to.be.revertedWithCustomError(
        contracts.GiveawayClaim,
        "InvalidProof()"
      );
    });
  });
});
