import { JsonRpcProvider, ExternalProvider } from '@ethersproject/providers';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface HHGaslessDeployerConfig {
  contract?: string;
  initArgsPath?: string; // constructor arguments
  salt?: string;
  signer?: any;
  network?: string;
  rpcUrl: JsonRpcProvider | ExternalProvider | undefined;
  paymaster_address?: string;
  relayer_hub_address?: string;
  forwarder?: string;
}

export type ContractJson = { abi: any; bytecode: string };
