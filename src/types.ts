import { ExternalProvider, JsonRpcProvider } from "@ethersproject/providers";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface HHGaslessDeployerConfig {
  contract?: string;
  initArgsPath?: string; // constructor arguments
  salt?: string;
  signer?: any;
  network?: string;
  rpcUrl: any;
  paymaster?: string;
  relayerHub?: string;
  forwarder?: string;
}

export type ContractJson = { abi: any; bytecode: string };
