import hre, {
  deployments,
  getNamedAccounts,
  getUnnamedAccounts,
} from "hardhat";
import { GiveawayClaim } from "../../../typechain";
import { setupUser, setupUsers } from "./../accounts";
export interface Contracts {
  GiveawayClaim: GiveawayClaim;
}

export interface User extends Contracts {
  address: string;
}

export const setupIntegration = deployments.createFixture(
  async ({ ethers }) => {
    const { deployer, deployerMultisig, admin } = await getNamedAccounts();

    const WHALE_ACCOUNT = process.env.WHALE_ADDRESS;
    if (!WHALE_ACCOUNT) {
      throw new Error("WHALE_ADDRESS is not set");
    }
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [WHALE_ACCOUNT],
    });

    await hre.network.provider.send("hardhat_setBalance", [
      WHALE_ACCOUNT,
      ethers.hexlify(ethers.toUtf8Bytes(ethers.parseEther("10.0").toString())),
    ]);

    const whale = await ethers.provider.getSigner(WHALE_ACCOUNT);

    await whale.sendTransaction({
      to: deployer,
      value: ethers.parseEther("10.0"),
    });

    await whale.sendTransaction({
      to: admin,
      value: ethers.parseEther("10.0"),
    });

    await deployments.fixture(["DeployGiveawayClaim"]);

    const ClaimsActivatedContractFactory = await ethers.getContractFactory(
      "GiveawayClaim"
    );

    const GiveawayClaim = await ClaimsActivatedContractFactory.deploy(admin);

    const contracts: Contracts = {
      GiveawayClaim: GiveawayClaim,
    };

    const users: User[] = await setupUsers(
      await getUnnamedAccounts(),
      contracts
    );

    try {
      await whale.sendTransaction({
        to: contracts.GiveawayClaim.target,
        value:
          ethers.parseEther(process.env.INDIVIDUAL_PRIZE_AMOUNT as string) *
          BigInt(process.env.NUMBER_OF_WINNERS as string), // fund the contract with 100 USD * 3 in wei
      });
    } catch (error) {
      console.log("error", error);
    }

    return {
      contracts,
      deployer: <User>await setupUser(deployer, contracts),
      deployerMultisig: <User>await setupUser(deployerMultisig, contracts),
      admin: <User>await setupUser(admin, contracts),
      users,
    };
  }
);
