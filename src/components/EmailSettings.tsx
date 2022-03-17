import React, { useCallback, useState } from "react";
import { SubmitHandler, FieldValues } from "react-hook-form";
import { useWallet } from "@raidguild/quiver";
import styled from "styled-components";

import { useCeramic } from "context/CeramicContext";
import Button from "components/Button";
import { Dialog, DialogContainer } from "components/Dialog";
import ExternalLink from "components/ExternalLink";
import Text from "components/Text";
import Title from "components/Title";
import EmailCrendentialsForm from "./EmailCredentialsForm";
import { updatePublication } from "services/publication/slice";
import { networks } from "lib/networks";
import { useAppDispatch, useAppSelector } from "store";

const EmailSettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.backgroundGrey};
  padding: 3.2rem;
  gap: 1.6rem;
  width: 100%;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: auto;
  }
`;

const ConfigureButtonContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 2.4rem;
`;

const SettingsContainer = styled.div`
  background: ${({ theme }) => theme.colors.backgroundGrey};
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
`;

const EmailSettings = () => {
  const dispatch = useAppDispatch();
  const [hide, setHide] = useState(false);
  const { chainId } = useWallet();
  const { client } = useCeramic();
  const publicationLoading = useAppSelector(
    (state) => state.updatePublication.loading
  );
  const onSubmit: SubmitHandler<FieldValues> = useCallback(async (data) => {
    if (!chainId || !client) {
      return;
    }
    // dispatch update
    await dispatch(
      updatePublication({
        publication: {
          apiKey: data.apiKey || "",
          mailTo: data.mailFrom || "",
        },
        chainName: networks[chainId].litName,
        client,
      })
    );
    // setHide(true);
  }, []);

  return (
    <EmailSettingsContainer>
      <Title size="md" color="helpText">
        Email Service
      </Title>
      <Text size="base" color="label">
        Currently we support sengrid to send emails and it&#39;s required to
        have a sendgrid account in order to start mailing to your subscribers.
      </Text>
      <ConfigureButtonContainer>
        <Dialog
          baseId="email-settings"
          backdrop={true}
          hideModal={hide}
          disclosure={
            <Button color="primary" variant="contained" size="md">
              Email Settings
            </Button>
          }
        >
          <DialogContainer>
            <Text size="base" color="helpText">
              Email Service
            </Text>
            <SettingsContainer>
              <Title size="sm" color="grey">
                Setting to send out a post to your subscribers
              </Title>
              <Text size="sm" color="label" as="span">
                Having issues setting up?{" "}
                <ExternalLink href="www.google.com">
                  <Text size="sm" color="primary" as="span">
                    Read guide
                  </Text>
                </ExternalLink>
              </Text>
              <EmailCrendentialsForm onSubmit={onSubmit}>
                <Button
                  size="md"
                  color="primary"
                  variant="contained"
                  isLoading={publicationLoading}
                  loadingText="Saving..."
                  type="submit"
                  onClick={() => setHide(true)}
                >
                  Save
                </Button>
              </EmailCrendentialsForm>
            </SettingsContainer>
          </DialogContainer>
        </Dialog>
        <ExternalLink href="www.google.com">
          <Text size="md" color="primary">
            Learn more
          </Text>
        </ExternalLink>
      </ConfigureButtonContainer>
    </EmailSettingsContainer>
  );
};

export default EmailSettings;
