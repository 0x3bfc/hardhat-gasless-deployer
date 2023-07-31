/* eslint-disable @typescript-eslint/no-explicit-any */
import { extendConfig, subtask, task } from "hardhat/config";
import "./type-extensions";
import { hHGaslessDeployerConfigExtender } from "./config";
import { VALUE, PLUGIN_NAME, VERIFY_NETWORK_SUB_TASK } from "./constants";
import { networks, urls } from "./networks";
import { Deployer } from "./deployer";

import abi from "./abi/Deployer.json";

import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import "@nomicfoundation/hardhat-ethers";
import { ContractDeployTransaction } from "ethers";
import { loadInitCode, randomSalt } from "./utils";

extendConfig(hHGaslessDeployerConfigExtender);

task("gaslessDeploy", "Deploy contract using GSN").setAction(async (_, hre) => {
  // verify network
  await hre.run(VERIFY_NETWORK_SUB_TASK);
  // compile contracts
  await hre.run("compile");
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
  let initcode: ContractDeployTransaction = !hre.config.hHGaslessDeployer
    .initArgsPath
    ? await contract.getDeployTransaction()
    : await loadInitCode(
        hre,
        contract,
        hre.config.hHGaslessDeployer.initArgsPath,
      );

  //TODO: Should skip deployment if they were already deployed
  const [deployer] = await hre.ethers.getSigners();
  let factory = new Deployer(hre, deployer);
  await factory.deployAndInitFactoryAndPaymaster();

  let salt = hre.config.hHGaslessDeployer.salt
    ? hre.config.hHGaslessDeployer.salt
    : randomSalt();
  // deploy target contract
  const target = await factory.deployTargetContract(salt, initcode);
  console.log(
    `Target contract "${hre.config.hHGaslessDeployer.contract}" has been deployed @ ${target}`,
  );
});

subtask(VERIFY_NETWORK_SUB_TASK).setAction(async (_, hre) => {
  let network = hre?.config?.hHGaslessDeployer?.network;
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
