import { JsonRpcProvider } from "ethers";
import { ConfigExtender } from "hardhat/types";

export const hHGaslessDeployerConfigExtender: ConfigExtender = (
  config,
  userConfig,
) => {
  const defaultConfig = {
    contract: undefined,
    initArgsPath: undefined,
    salt: undefined,
    signer: undefined,
    network: undefined,
    rpcUrl: undefined,
    paymaster: undefined,
    relayerHub: undefined,
    forwarder: undefined,
  };

  if (userConfig.hHGaslessDeployer) {
    const customConfig = userConfig.hHGaslessDeployer;
    config.hHGaslessDeployer = {
      ...defaultConfig,
      ...customConfig,
    };
  } else {
    config.hHGaslessDeployer = defaultConfig;
  }
};
