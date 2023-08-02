# hardhat-gasless-deployer

This hardhat plugin allows developers to execute gasless contracts deployments using a [GSN](https://opengsn.org/) provider.

## Installation

```bash
yarn add hardhat-gasless-deployer
```

## Usage

- update the `hardhat.config.js`:

For javascript:
```javascript
require('hardhat-gasless-deployer');
```

Or if you are using TypeScript:

```typescript
import 'hardhat-gasless-deployer';
```

## Configurations
The minimal configuration that must be added before using this plugin is as follows:

```javascript
module.exports = {
  networks: {
    mainnet: { ... }
  },
  hHGaslessDeployer: {
    contract:"THE_CONTRACT_NAME_TO_BE_DEPLOYED",
    initArgsPath: "PATH_TO_CONSTRUCTOR_ARGS_IN_TS_OR_JS",
    salt: "SALT_FOR_CREATE2_DEPLOYMENT", // Optional
    value: "VALUE_IN_ETH_PASSED_TO_THE_DEPLOYED_CONTRACT",
    network: "localhost", // ie. local gsn network
    rpcUrls: "http://127.0.0.1:8545",
    paymaster: "GET_THIS_ADDRESS_FROM_YOUR_GSN_PROVIDER",
    relayerHub: "GET_THIS_ADDRESS_FROM_YOUR_GSN_PROVIDER",
    forwarder: "GET_THIS_ADDRESS_FROM_YOUR_GSN_PROVIDER",
  },
};
```