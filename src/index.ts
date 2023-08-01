/* eslint-disable @typescript-eslint/no-explicit-any */
import "@nomicfoundation/hardhat-ethers";
import { ContractDeployTransaction } from "ethers";
import { extendConfig, subtask, task } from "hardhat/config";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";

import { hHGaslessDeployerConfigExtender } from "./config";
import { COMPILE, PLUGIN_NAME, VERIFY_NETWORK_SUB_TASK } from "./constants";
import { Deployer } from "./deployer";
import { networks } from "./networks";
import "./type-extensions";
import { loadInitCode, randomSalt } from "./utils";

extendConfig(hHGaslessDeployerConfigExtender);

task("gaslessDeploy", "Deploy contract using GSN").setAction(async (_, hre) => {
  // verify network
  await hre.run(VERIFY_NETWORK_SUB_TASK);
  // TODO: add extra config verification here
  // compile contracts
  await hre.run(COMPILE);
  // load contract ABI
  let contract;

  if (hre.config.hHGaslessDeployer.contract) {
    contract = await hre.ethers.getContractFactory(
      hre.config.hHGaslessDeployer.contract,
    );
  } else {
    throw new NomicLabsHardhatPluginError(
      PLUGIN_NAME,
      `Invalid contract name!`,
    );
  }

  // get initcode
  const initcode: ContractDeployTransaction = !hre.config.hHGaslessDeployer
    .initArgsPath
    ? await contract.getDeployTransaction()
    : await loadInitCode(
        hre,
        contract,
        hre.config.hHGaslessDeployer.initArgsPath,
      );

  // TODO: Should skip factory and paymaster deployment
  // if they were already deployed
  const [deployer] = await hre.ethers.getSigners();
  // This factory needs to be deployed with the paymaster
  // in order to execute gasless deployments for future
  // contracts.
  const factory = new Deployer(hre, deployer);
  await factory.deployAndInitFactoryAndPaymaster();

  const salt = hre.config.hHGaslessDeployer.salt
    ? hre.config.hHGaslessDeployer.salt
    : randomSalt();
  // deploy target contract
  const target = await factory.deployTargetContract(hre, salt, initcode);
  console.log(
    `Target contract "${hre.config.hHGaslessDeployer.contract}" has been deployed @ ${target}`,
  );
});

subtask(VERIFY_NETWORK_SUB_TASK).setAction(async (_, hre) => {
  const network = hre?.config?.hHGaslessDeployer?.network;
  if (network != undefined) {
    if (!networks.includes(network)) {
      throw new NomicLabsHardhatPluginError(
        PLUGIN_NAME,
        `${network} is not supported. The currently supported networks are
            ${networks}.`,
      );
    }
  }
});
