import { ChainName } from "types";

type Network = {
  chainId: number;
  name: string;
  litName: ChainName;
  symbol: string;
  explorer: string;
  rpc: string;
};

export const networks: { [key: number]: Network } = {
  1: {
    chainId: 1,
    name: "Mainnet",
    litName: "ethereum",
    symbol: "ETH",
    explorer: "https://etherscan.io",
    rpc: "https://mainnet.infura.io/v3/<your infura project id>",
  },
  4: {
    chainId: 4,
    name: "Rinkeby",
    litName: "rinkeby",
    symbol: "ETH",
    explorer: "https://rinkeby.etherscan.io",
    rpc: "https://rinkeby.infura.io/v3/<your infura project id>",
  },
};
