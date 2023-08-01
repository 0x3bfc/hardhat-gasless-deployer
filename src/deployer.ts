import { TransactionReceipt } from "@ethersproject/providers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Address } from "@opengsn/provider";
import {
  Contract,
  ContractDeployTransaction,
  ContractFactory,
  ethers,
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
import { getGSNProvider } from "./gsnProvider";
import { ContractJson } from "./types";

export class Deployer {
  public env: HardhatRuntimeEnvironment;
  public deployer: HardhatEthersSigner;
  public artifacts: { [name: string]: ContractJson };
  public factoryAddress: Address | undefined;
  public paymasterAddress: Address | undefined;

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
    this.factoryAddress = await factory.getAddress();

    console.log(
      `Deployer contract has been successfully deployed @ ${this.factoryAddress}`,
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

    this.paymasterAddress = await paymaster.getAddress();

    console.log(
      `Paymaster contract has been successfully deployed @ ${this.paymasterAddress}`,
    );
  }

  public async deployTargetContract(
    hre: HardhatRuntimeEnvironment,
    salt: string,
    bytecode: ContractDeployTransaction,
  ): Promise<TransactionReceipt> {
    const provider = await getGSNProvider(hre);
    const saltHash = hre.ethers.keccak256(salt.toString());
    const factory = await hre.ethers.getContractAt(
      this.artifacts.Factory.abi,
      this.factoryAddress as string,
      provider.gsnSigner,
    );
    const txOptions = {
      gasPrice: (await provider.gsnProvider.getFeeData()).gasPrice,
    };
    const tx = await factory.deploy(saltHash, bytecode, txOptions);
    console.log(`Transaction ${tx.hash} sent`);
    const receipt = await tx.wait();
    console.log(`Mined in block: ${receipt.blockNumber}`);
    return receipt;
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
