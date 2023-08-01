import { Contract, ContractDeployTransaction, ContractFactory } from "ethers";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import path from "path";

import { PLUGIN_NAME, RANDOM_MAX } from "./constants";

export async function loadInitCode(
  hre: HardhatRuntimeEnvironment,
  contract: ContractFactory<any[], Contract>,
  initArgsPath: string,
): Promise<ContractDeployTransaction> {
  const args = await import(
    path.normalize(path.join(hre.config.paths.root, initArgsPath))
  );

  const ext = initArgsPath.split(".").pop();
  if (ext === "ts") {
    return contract.getDeployTransaction(...args.data);
  } else if (ext === "js") {
    return contract.getDeployTransaction(...args.default);
  } else {
    throw new NomicLabsHardhatPluginError(
      PLUGIN_NAME,
      `Unsupported file extension: ${ext}`,
    );
  }
}

export function randomSalt() {
  // TODO: fix this dummy random salt
  return `0xFF${Math.floor(Math.random() * RANDOM_MAX)}`;
}
