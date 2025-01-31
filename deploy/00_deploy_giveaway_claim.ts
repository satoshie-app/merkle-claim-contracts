import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  // Get named accounts
  const { deployer, admin } = await getNamedAccounts();

  console.log("Deploying contracts with the account:", deployer);

  // Ensure admin address is set
  if (!admin) {
    throw new Error("Admin address is not defined in named accounts.");
  }

  console.log("Admin address:", admin);

  // Deploy GiveawayClaim
  console.log("Deploying GiveawayClaim...");
  const giveawayClaimContract = await deploy("GiveawayClaim", {
    from: deployer,
    args: [admin], // Constructor argument: admin address
    log: true,
    waitConfirmations: 1,
  });

  console.log("GiveawayClaim deployed to:", giveawayClaimContract.address);

  // Verify the contract if not on a local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: giveawayClaimContract.address,
        constructorArguments: [admin],
      });
    } catch (error) {
      console.log("Verification failed:", error);
    }
  }

  console.log("Deployment completed:");
  console.log("GiveawayClaim Contract:", `"${giveawayClaimContract.address}"`);
  console.log("Admin Address:", admin);
};

export default func;
func.id = "deploy_giveaway_claim";
func.tags = ["GiveawayClaim"];
