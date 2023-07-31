import {
  Contract,
  ContractDeployTransaction,
  ContractFactory,
} from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import {
  abi as DeployerAbi,
  bytecode as DeployerBytecode,
} from "./abi/DeployerABI.json";
import {
  abi as WhitelistPaymasterAbi,
  bytecode as WhitelistPaymasterBytecode,
} from "./abi/WhitelistPaymasterABI.json";
import { ContractJson } from "./types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

export class Deployer {
  public env: HardhatRuntimeEnvironment;
  public deployer: HardhatEthersSigner;
  public artifacts: { [name: string]: ContractJson };

  constructor(hre: HardhatRuntimeEnvironment, deployer: HardhatEthersSigner) {
    this.env = hre;
    this.deployer = deployer;
    this.artifacts = {
      Factory: { abi: DeployerAbi, bytecode: DeployerBytecode },
      WhitelistPaymaster: {
        abi: WhitelistPaymasterAbi,
        bytecode: WhitelistPaymasterBytecode,
      },
    };
  }

  public async deployAndInitFactoryAndPaymaster() {
    // deploy factory (deployer contract)
    const factory = (await this.deploy<Contract>(
      this.artifacts.Factory,
      [this.env.config.hHGaslessDeployer.forwarder],
      this.deployer,
    )) as Contract;

    console.log(
      `Deployer contract has been successfully deployed @ ${await factory.getAddress()}`,
    );
    // deploy whitelist paymaster
    const paymaster = (await this.deploy<Contract>(
      this.artifacts.WhitelistPaymaster,
      [],
      this.deployer,
    )) as Contract;

    // init whitelist paymaster
    await paymaster.setRelayHub(
      this.env.config.hHGaslessDeployer.relayer_hub_address,
    );
    await paymaster.setTrustedForwarder(
      this.env.config.hHGaslessDeployer.forwarder,
    );
    const deployerAddress = await this.deployer.getAddress();
    await paymaster.whitelistSender(deployerAddress);

    console.log(
      `Paymaster contract has been successfully deployed @ ${await paymaster.getAddress()}`,
    );
  }

  public async deployTargetContract(
    salt: string,
    bytecode: ContractDeployTransaction,
  ) {
    // TODO: generate salt
    // TODO: build tx options
    // TODO: call deploy in the deployer
    // TODO: log the tx receipt
  }

  async deploy<T>(
    contract: ContractJson,
    deployParams: any[],
    actor: HardhatEthersSigner,
  ) {
    const factory = new ContractFactory(contract.abi, contract.bytecode, actor);
    return factory.deploy(...deployParams);
  }
}
