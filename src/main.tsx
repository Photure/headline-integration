import { WalletProvider } from "@alexkeating/quiver";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Provider as ReakitProvider } from "reakit";
import { ThemeProvider } from "styled-components";
import WalletConnectProvider from "@walletconnect/ethereum-provider";
import { SnackbarProvider } from "notistack";
import { styled } from "@mui/material";
import { IProviderOptions } from "web3modal";
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloProvider,
} from "@apollo/client";

import { CeramicProvider } from "context/CeramicContext";
import { LitProvider } from "context/LitContext";
import { UnlockProvider } from "context/UnlockContext";
import GlobalStyle from "GlobalStyle";
import { networks } from "lib/networks";
import Routes from "Routes";
import { store } from "store";
import theme from "theme";

import "./index.css";

// import Inter globally from fontsource
import "@fontsource/inter/latin.css";
import { ItemsProvider } from "context/ItemsContext";

const providerOptions: IProviderOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      rpc: {
        "0x1": networks["0x1"].rpc,
        "0x4": networks["0x4"].rpc,
        "0x64": networks["0x64"].rpc,
        "0x38": networks["0x38"].rpc,
        "0x89": networks["0x89"].rpc,
      },
    },
  },
};
const web3modalOptions = {
  cacheProvider: false,
  providerOptions,
  theme: "dark",
};

const StyledSnackbarProvider = styled(SnackbarProvider)`
  &.SnackbarItem-variantSuccess {
    background-color: #8aca89;
    color: #fcfcfc;
    font-family: Inter;
    font-size: 1.6rem;
  }

  &.SnackbarItem-variantError {
    background-color: #ff6771;
    color: #fcfcfc;
    font-family: Inter;
    font-size: 1.6rem;
  }
`;

const Root = () => {
  return (
    <StyledSnackbarProvider
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <Routes />
    </StyledSnackbarProvider>
  );
};

const httpLink = new HttpLink({
  uri: "https://api.thegraph.com/subgraphs/name/photure/photure-graph", // TEST_TOKENS_QUERY_ENDPOINT,
  fetchOptions: {
    mode: "no-cors",
  },
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <WalletProvider
        web3modalOptions={web3modalOptions}
        networks={networks}
        defaultChainId={"0x1"}
        // Optional but useful to handle events.
        handleModalEvents={(eventName, error) => {
          if (error) {
            console.error(error.message);
          }
          console.log(eventName);
        }}
      >
        <UnlockProvider>
          <LitProvider>
            <ThemeProvider theme={theme}>
              <CeramicProvider>
                <ReakitProvider>
                  <ApolloProvider client={client}>
                    <ItemsProvider>
                      <Root />
                    </ItemsProvider>
                  </ApolloProvider>
                </ReakitProvider>
              </CeramicProvider>
            </ThemeProvider>
            <GlobalStyle />
          </LitProvider>
        </UnlockProvider>
      </WalletProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
