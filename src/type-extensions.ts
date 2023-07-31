import "hardhat/types/config";

import { HHGaslessDeployerConfig } from "./types";

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    hHGaslessDeployer?: HHGaslessDeployerConfig;
  }

  interface HardhatConfig {
    hHGaslessDeployer: HHGaslessDeployerConfig;
  }
}
