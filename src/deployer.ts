import { TransactionReceipt } from "@ethersproject/providers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Address } from "@opengsn/provider";
import { Contract, ContractDeployTransaction, ContractFactory } from "ethers";
import fs from "fs";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import {
  abi as DeployerAbi,
  bytecode as DeployerBytecode,
} from "./abi/DeployerABI.json";
import {
  abi as WhitelistPaymasterAbi,
  bytecode as WhitelistPaymasterBytecode,
} from "./abi/WhitelistPaymasterABI.json";
import { GASLESS_DEPLOYERS_FILE, PLUGIN_NAME } from "./constants";
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

  public async deployAndInitFactoryAndPaymaster(
    hre: HardhatRuntimeEnvironment,
  ) {
    if (
      !(await this.isDeployerInitialized(
        hre.config.hHGaslessDeployer.network as string,
      ))
    ) {
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

      this.paymasterAddress = await paymaster.getAddress();

      console.log(
        `Paymaster contract has been successfully deployed @ ${this.paymasterAddress}`,
      );

      // init whitelist paymaster
      await paymaster.setRelayHub(this.env.config.hHGaslessDeployer.relayerHub);
      console.log(
        `RelayHub (this.env.config.hHGaslessDeployer.relayer_hub_address) has been successfully registerd at paymaster (${this.paymasterAddress})`,
      );
      await paymaster.setTrustedForwarder(
        this.env.config.hHGaslessDeployer.forwarder,
      );

      console.log(
        `Forwarder (this.env.config.hHGaslessDeployer.forwarder) has been successfully added to paymaster (${this.paymasterAddress})`,
      );

      const deployerAddress = await this.deployer.getAddress();
      await paymaster.whitelistSender(deployerAddress, true);
      console.log(
        `Deployer (deployerAddress) has been successfully whitelisted at paymaster (${this.paymasterAddress})`,
      );
      // save deployment
      const data = {
        gsn: {
          factory: this.factoryAddress,
          paymaster: this.paymasterAddress,
        },
      };
      await this.saveDeployment(data);
    } else {
      const data = await this.getDeployerContracts(
        hre.config.hHGaslessDeployer.network as string,
      );
      this.factoryAddress = data.factory;
      this.paymasterAddress = data.paymaster;
    }
  }

  public async deployTargetContract(
    hre: HardhatRuntimeEnvironment,
    salt: string,
    bytecode: ContractDeployTransaction,
  ): Promise<{
    receipt: TransactionReceipt;
    contractAddress: string;
  }> {
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
    // TODO: replace bytecodex with bytcode
    const tx = await factory.deploy(
      hre.config.hHGaslessDeployer.value,
      saltHash,
      bytecode.data,
      txOptions,
    );
    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    return {
      receipt,
      contractAddress: await factory.computeAddress(
        saltHash,
        hre.ethers.keccak256(bytecode.data),
      ),
    };
  }

  async isDeployerInitialized(network: string) {
    try {
      const jsonData = fs.readFileSync(GASLESS_DEPLOYERS_FILE, "utf8");
      const data = JSON.parse(jsonData);
      return (
        data[network].factory != undefined &&
        data[network].paymaster != undefined
      );
    } catch (error) {
      return false;
    }
  }

  async saveDeployment(data: any) {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(GASLESS_DEPLOYERS_FILE, jsonData, "utf8");
  }

  async getDeployerContracts(network: string) {
    try {
      const jsonData = fs.readFileSync(GASLESS_DEPLOYERS_FILE, "utf8");
      const data = JSON.parse(jsonData);
      return data[network];
    } catch (error) {
      throw new NomicLabsHardhatPluginError(
        PLUGIN_NAME,
        "Failed to open the deployment files",
      );
    }
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
