import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useWallet } from "@raidguild/quiver";
import { useNavigate } from "react-router-dom";
import { useRadioState, Radio, RadioStateReturn } from "reakit/Radio";
import styled from "styled-components";

import { useCeramic } from "context/CeramicContext";
import Button from "components/Button";
import { Dialog, DialogContainer } from "components/Dialog";
import ExternalLink from "components/ExternalLink";
import Icon from "components/Icon";
import FormTextArea from "components/FormTextArea";
import Text from "components/Text";
import Title from "components/Title";
import {
  articleRegistrySelectors,
  removeRegistryArticle,
} from "services/articleRegistry/slice";
import { lockSelectors } from "services/lock/slice";
import { publishArticle } from "services/article/slice";

import { useAppDispatch, useAppSelector } from "store";
import { fetchIPFS, storeIpfs } from "lib/ipfs";
import { sendMessage } from "lib/mailgun";
import { networks } from "lib/networks";

import portrait from "assets/portrait.svg";
import settings from "assets/settings.svg";

const ReceiverSettingContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  background: ${({ theme }) => theme.colors.almostWhite};
  @media (max-width: 768px) {
    padding: 2.4rem 1.6rem;
    border-radius: 0.8rem;
    background: "##F6F6F6";
    max-width: content;
    gap: 0.8rem;
  }
`;

const SocialPreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.almostWhite};
  gap: 1.6rem;
  @media (max-width: 768px) {
    padding: 2.4rem 1.6rem;
    border-radius: 0.8rem;
    background: "#f6f6f6";
    max-width: content;
    gap: 0.8rem;
  }
`;

const ImagePreview = styled.div`
  border: ${({ theme }) => `.2rem dashed ${theme.colors.lightGrey}`};
  max-height: 11rem;
  max-width: 24rem;
  height: 100%;
  width: 100%;
  height: 11rem;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
`;

const SendingTestEmailContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.almostWhite};
  gap: 1.6rem;
  @media (max-width: 768px) {
    padding: 2.4rem 1.6rem;
    border-radius: 0.8rem;
    background: "#f6f6f6";
    max-width: content;
    gap: 0.8rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 2.4rem;
`;

const RadioButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  @media (max-width: 768px) {
    gap: 1.6rem;
  }
`;

const StyledIconButton = styled(Button)`
  padding: 0rem;
  height: auto;
`;

const StyledIcon = styled(Icon)`
  padding: 1rem;
  height: auto;
`;

const ReceiverSettings = ({
  radio,
  allowPaid,
}: {
  radio: RadioStateReturn;
  allowPaid: boolean;
}) => {
  return (
    <ReceiverSettingContainer>
      <Title size="sm" color="helpText">
        This post is for
      </Title>
      <RadioButtonContainer>
        <label>
          <Radio {...radio} value="free" /> Everyone
        </label>
        <label>
          <Radio {...radio} value="paid" disabled={!allowPaid} /> Paid
          subscribers
        </label>
      </RadioButtonContainer>
    </ReceiverSettingContainer>
  );
};

const SocialPreview = ({
  previewImg,
  setPreviewImg,
  description,
  setDescription,
  articlePreviewLink,
}: {
  previewImg: File | null;
  setPreviewImg: (arg0: File | null) => void;
  description: string;
  setDescription: (arg0: string) => void;
  articlePreviewLink: string | undefined;
}) => {
  const hiddenImageInput = useRef<HTMLInputElement>(null);
  const clickImageInput = () => {
    hiddenImageInput?.current?.click();
  };
  useEffect(() => {
    const x = async () => {
      if (articlePreviewLink) {
        const b = await fetchIPFS(articlePreviewLink);
        if (b) {
          setPreviewImg(new File([b], "previewImg.jpeg"));
        }
      }
    };
    x();
  }, [articlePreviewLink]);

  const uploadImage = useCallback(
    (e) => {
      const input = hiddenImageInput.current || { files: null };
      // const validImage = false;
      if (input.files) {
        const file = input.files[0];
        if (!file) {
          return;
        }
        // validImage =
        //   file.type === "image/jpeg" ||
        //   file.type === "image/png" ||
        //   file.type === "image/svg+xml";
        setPreviewImg(file);
      }
    },
    [hiddenImageInput.current]
  );

  return (
    <SocialPreviewContainer>
      <Title size="sm" color="helpText">
        Social Preview
      </Title>
      <Text size="base" color="grey">
        Changing the preview text will only affect the social preview, not the
        post content itself
      </Text>
      {previewImg ? (
        <img
          src={URL.createObjectURL(previewImg)}
          onClick={clickImageInput}
          style={{ height: "11rem", objectFit: "contain" }}
        />
      ) : (
        <ImagePreview onClick={clickImageInput}>
          <Icon size="lg" src={portrait} alt="portrait" />
        </ImagePreview>
      )}
      <input
        type="file"
        ref={hiddenImageInput}
        style={{ display: "none" }}
        onClick={uploadImage}
        onChange={uploadImage}
      />
      <FormTextArea
        title="Preview text"
        errorMsg=""
        value={description}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
          setDescription(e.target?.value)
        }
      />
    </SocialPreviewContainer>
  );
};

export const ArticleSettings = ({
  streamId,
  saveArticle,
}: {
  streamId: string | undefined;
  saveArticle: (
    arg0: string,
    arg1: string,
    arg2: string,
    arg3: string | File | undefined,
    arg4: boolean
  ) => void;
}) => {
  const dispatch = useAppDispatch();
  const { client } = useCeramic();
  const article = useAppSelector((state) =>
    articleRegistrySelectors.getArticleByStreamId(state, streamId || "")
  );
  const [saving, setSaving] = useState(false);

  const loadingDelete = useAppSelector((state) => state.removeArticle.loading);
  const locks = useAppSelector((state) => lockSelectors.paidLocks(state));
  const navigate = useNavigate();

  const radio = useRadioState({
    state: `${article?.paid ? "paid" : "free"}`,
  });
  const [previewImg, setPreviewImg] = useState<File | null>(null);
  const [description, setDescription] = useState(article?.description || "");
  const [hide, setHide] = useState(false);

  const submitSettings = useCallback(async () => {
    setSaving(true);
    const a = await saveArticle(
      article?.text || "",
      article?.title || "",
      description,
      previewImg || undefined,
      radio.state !== "free"
    );
    setHide(true);
    setSaving(false);
  }, [description, article, previewImg, radio.state]);

  const deleteArticle = useCallback(async () => {
    // dispatch delete
    if (streamId && client) {
      await dispatch(removeRegistryArticle({ streamId, client }));
      navigate("/publish");
    }
  }, []);

  console.log("Length");
  console.log(locks);
  console.log(locks.length);

  return (
    <Dialog
      baseId="article-settings"
      backdrop={true}
      hideModal={hide}
      disclosure={
        <StyledIconButton
          size="sm"
          color="primary"
          variant="outlined"
          onClick={() => setHide(false)}
        >
          <StyledIcon size="md" src={settings} alt="settings button" />
        </StyledIconButton>
      }
    >
      <DialogContainer>
        <Text size="base">Post setting</Text>
        <ReceiverSettings
          radio={radio}
          allowPaid={locks.length > 0 ? true : false}
        />
        <SocialPreview
          description={description}
          setDescription={setDescription}
          previewImg={previewImg}
          setPreviewImg={setPreviewImg}
          articlePreviewLink={article?.previewImg}
        />
        <SendingTestEmailContainer>
          <Title size="sm" color="helpText">
            Sending a test email
          </Title>
          <Text size="base" color="label">
            Please configure your SMTP credentials in the setting page in order
            to send out a test email
          </Text>
          <ExternalLink href="www.google.com">
            <Text size="base" color="primary" weight="semibold">
              Learn More
            </Text>
          </ExternalLink>
        </SendingTestEmailContainer>
        <ButtonContainer>
          <Button
            size="md"
            color="primary"
            variant="contained"
            onClick={submitSettings}
            loadingText={"Saving..."}
            isLoading={saving}
          >
            Save
          </Button>
          {streamId && (
            <Button
              size="md"
              color="error"
              variant="contained"
              onClick={deleteArticle}
              loadingText="Deleting..."
              isLoading={loadingDelete}
            >
              Delete this post
            </Button>
          )}
        </ButtonContainer>
      </DialogContainer>
    </Dialog>
  );
};

export const PublishModal = ({ streamId }: { streamId: string }) => {
  const dispatch = useAppDispatch();
  const { chainId } = useWallet();
  const { client } = useCeramic();
  const article = useAppSelector((state) =>
    articleRegistrySelectors.getArticleByStreamId(state, streamId || "")
  );
  const publishLoading = useAppSelector(
    (state) => state.publishArticle.loading
  );
  const emailSettings = useAppSelector(
    (state) => state.publication.emailSettings
  );
  const locks = useAppSelector((state) => lockSelectors.paidLocks(state));

  const [hide, setHide] = useState(false);
  const [previewImg, setPreviewImg] = useState<File | null>(null);
  const [description, setDescription] = useState(article?.description || "");
  const radio = useRadioState({
    state: `${article?.paid ? "paid" : "free"}`,
  });

  const publish = async () => {
    if (chainId && client) {
      let previewUrl = "";
      if (previewImg) {
        previewUrl = await storeIpfs(await previewImg.arrayBuffer());
      }

      const readyArticle = {
        ...article,
        description: description || article?.description,
        previewImg: previewUrl || article?.previewImg,
        paid: radio.state !== "free",
      };

      console.log(radio);
      console.log("Published article");
      console.log(article);
      await dispatch(
        publishArticle({
          article: readyArticle,
          streamId,
          encrypt: readyArticle?.paid || false,
          chainName: networks[chainId].litName,
          client,
        })
      );
      // email article
      const params = {
        from: emailSettings?.mailFrom || "",
        to: ["keating.dev@protonmail.com", "alexander.keating@protonmail.com"],
        subject: article.title,
        text: article.text,
        domain: emailSettings?.domain || "",
        apiKey: emailSettings?.apiKey || "",
      };
      await sendMessage(params);
      setHide(true);
    }
  };

  return (
    <Dialog
      baseId="publish"
      backdrop={true}
      hideModal={hide}
      disclosure={
        <Button
          size="md"
          color="primary"
          variant="contained"
          onClick={() => setHide(false)}
        >
          {article?.status === "published" ? "Published" : "Publish"}
        </Button>
      }
    >
      <DialogContainer>
        <ReceiverSettings
          radio={radio}
          allowPaid={locks.length > 0 ? true : false}
        />
        <SocialPreview
          description={description}
          setDescription={setDescription}
          previewImg={previewImg}
          setPreviewImg={setPreviewImg}
          articlePreviewLink={article?.previewImg}
        />
        <SendingTestEmailContainer>
          <Text size="sm" color="grey">
            This post will only publish as a webpage/blog, since there is no
            mailing service set up yet.
          </Text>
        </SendingTestEmailContainer>
        <ButtonContainer>
          <Button
            size="md"
            color="primary"
            variant="contained"
            onClick={publish}
            loadingText={"Publishing..."}
            isLoading={publishLoading}
          >
            Publish
          </Button>
        </ButtonContainer>
      </DialogContainer>
    </Dialog>
  );
};
