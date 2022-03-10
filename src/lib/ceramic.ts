import { EthereumAuthProvider, WebClient, ConnectNetwork } from "@self.id/web";
import { Core } from "@self.id/core";
import { Caip10Link } from "@ceramicnetwork/stream-caip10-link";

export const getClient = async () => {
  const address = window.ethereum.selectedAddress;
  const authProvider = new EthereumAuthProvider(window.ethereum, address);

  const client = new WebClient({
    ceramic: import.meta.env?.VITE_CERAMIC_URL as ConnectNetwork,
    connectNetwork: "testnet-clay",
  });

  await client.authenticate(authProvider);
  return client;
};

export const fetchProfile = async (address: string) => {
  const core = new Core({ ceramic: "testnet-clay" });
  const link = await Caip10Link.fromAccount(
    core.ceramic,
    `${address.toLowerCase()}@eip155:1`
  );

  const profile = await core.get("basicProfile", link.did || "");
  return profile;
};
