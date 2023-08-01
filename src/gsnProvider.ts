import { RelayProvider } from "@opengsn/provider";
import { BrowserProvider, Signer } from "ethers";
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { PLUGIN_NAME } from "./constants";

export async function getGSNProvider(hre: HardhatRuntimeEnvironment): Promise<{
  gsnProvider: BrowserProvider;
  gsnSigner: Signer;
}> {
  const rpcUrl = hre.config.hHGaslessDeployer.rpcUrl;
  if (rpcUrl == undefined) {
    throw new HardhatPluginError(PLUGIN_NAME, `Invalid GSN RPC URL!`);
  }

  return RelayProvider.newEthersV6Provider({
    provider: rpcUrl,
    config: {
      loggerConfiguration: { logLevel: "debug" },
      paymasterAddress: hre.config.hHGaslessDeployer.paymaster_address,
    },
  });
}
