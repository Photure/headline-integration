import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { WebClient } from "@self.id/web";
import { PUBLISHED_MODELS } from "../../constants";
import { DataModel } from "@glazed/datamodel";

import {
  addRegistryArticle,
  articleRegistryActions,
} from "services/articleRegistry/slice";
import { addPublishRegistryArticle } from "services/publishRegistry/slice";

import { storeAndEncryptArticle } from "lib/headline";
import { RootState } from "store";
import { ChainName } from "types";
import { LitNodeClient } from "lib/lit";

export type CeramicArticle = {
  publicationUrl: string;
  title: string;
  createdAt: string;
  status: "draft" | "published";
  previewImg?: string;
  paid?: boolean;
  description?: string;
  publishedAt?: string;
};
export type Article = {
  text: string;
  streamId?: string;
} & CeramicArticle;

export const articleSlice = createSlice({
  name: "article",
  initialState: {
    publicationUrl: "",
    title: "",
    createdAt: "",
    status: "draft",
    paid: false,
    previewImg: "",
    loading: false,
    streamId: "",
    text: "",
    description: "",
  },
  reducers: {
    create(state, action: PayloadAction<Article>) {
      state.title = action.payload.title;
      state.createdAt = action.payload.createdAt;
      state.status = action.payload.status;
      state.paid = action.payload?.paid || false;
      state.previewImg = action.payload?.previewImg || "";
      state.streamId = action.payload?.streamId || "";
      state.text = action.payload?.text;
      state.description = action.payload?.description || "";
    },
  },
});

export const articleActions = articleSlice.actions;

export const createArticleSlice = createSlice({
  name: "createArticle",
  initialState: {
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createArticle.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(createArticle.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(createArticle.rejected, (state) => {
      state.loading = false;
    });
  },
});

export const updateArticleSlice = createSlice({
  name: "updateArticle",
  initialState: {
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(updateArticle.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(updateArticle.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(updateArticle.rejected, (state) => {
      state.loading = false;
    });
  },
});

export const publishArticleSlice = createSlice({
  name: "publishArticle",
  initialState: {
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(publishArticle.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(publishArticle.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(publishArticle.rejected, (state) => {
      state.loading = false;
    });
  },
});

export const createArticle = createAsyncThunk<
  Article | null,
  {
    article: Omit<Article, "publicationUrl">;
    client: WebClient;
    encrypt?: boolean;
    chainName?: ChainName;
    litClient: LitNodeClient;
  },
  {
    rejectValue: Error;
  }
>("article/create", async (args, thunkAPI) => {
  const client = args.client;
  const model = new DataModel({
    ceramic: client.ceramic,
    model: PUBLISHED_MODELS,
  });
  const content =
    args.article.text || JSON.stringify({ type: "doc", content: [] });
  try {
    const { publication } = thunkAPI.getState() as RootState;
    const publicationUrl = await storeAndEncryptArticle(
      args.chainName,
      publication,
      args.article.status,
      content,
      args.litClient,
      args.encrypt
    );

    const baseArticle = {
      publicationUrl: publicationUrl,
      title: args.article.title || "",
      createdAt: args.article.createdAt,
      status: args.article.status,
      description: args.article.description || "",
      paid: args.article.paid || false,
    };

    const doc = await model.createTile("Article", baseArticle);
    const streamId = doc.id.toString();
    let article = {
      ...baseArticle,
      streamId: streamId,
      text: args.article.text,
    } as Article;
    if (args.article.previewImg) {
      article = { ...article, previewImg: args.article.previewImg };
    }
    // TODO: Is this necessary with the article registry
    thunkAPI.dispatch(articleActions.create(article));
    thunkAPI.dispatch(addRegistryArticle({ streamId, client }));
    thunkAPI.dispatch(articleRegistryActions.add(article));
    // save to registry
    return article;
  } catch (err) {
    return thunkAPI.rejectWithValue(err as Error);
  }
});

export const updateArticle = createAsyncThunk(
  "article/update",
  async (
    args: {
      article: Omit<Article, "publicationUrl" | "createdAt">;
      streamId: string;
      encrypt?: boolean;
      chainName?: ChainName;
      client: WebClient;
      litClient: LitNodeClient;
    },
    thunkAPI
  ) => {
    const client = args.client;
    const content = args.article.text || "";
    const { articleRegistry } = thunkAPI.getState() as RootState;
    const existingArticle = articleRegistry[args.streamId];
    try {
      // if (args.encrypt && args.article.status !== "published") {
      const { publication } = thunkAPI.getState() as RootState;
      const publicationUrl = await storeAndEncryptArticle(
        args.chainName,
        publication,
        args.article.status,
        content,
        args.litClient,
        args.encrypt
      );
      if (!publicationUrl) {
        console.error("No publication url");
        return;
      }

      const baseArticle = {
        publicationUrl: publicationUrl,
        title: args.article.title || "",
        status: args.article.status,
        previewImg: args.article.previewImg,
        paid: args.article.paid || false,
        description: args.article.description,
      };

      const doc = await TileDocument.load(client.ceramic, args.streamId);
      const updatedArticle = {
        ...existingArticle,
        ...baseArticle,
      };
      console.log('updating article', updatedArticle);
      await doc.update(updatedArticle);
      thunkAPI.dispatch(
        articleRegistryActions.update({ ...updatedArticle, text: content })
      );
      return baseArticle;
    } catch (err) {
      console.error(err);
      return thunkAPI.rejectWithValue("Failed to update");
    }
  }
);

export const publishArticle = createAsyncThunk(
  "article/publish",
  async (
    args: {
      article: Omit<Article, "publicationUrl" | "createdAt">;
      streamId: string;
      encrypt?: boolean;
      chainName?: ChainName;
      client: WebClient;
      litClient: LitNodeClient;
    },
    thunkAPI
  ) => {
    const client = args.client;
    const content = args.article.text || "";
    const { articleRegistry } = thunkAPI.getState() as RootState;
    const existingArticle = articleRegistry[args.streamId];
    try {
      const { publication } = thunkAPI.getState() as RootState;
      const publicationUrl = await storeAndEncryptArticle(
        args.chainName,
        publication,
        "published",
        content,
        args.litClient,
        args.encrypt
      );
      if (!publicationUrl) {
        console.error("No publication url");
        return;
      }

      const baseArticle = {
        publicationUrl: publicationUrl,
        title: args.article.title || "",
        previewImg: args.article.previewImg,
        paid: args.article.paid || false,
        description: args.article.description,
        publishedAt: new Date().toISOString(),
        status: "published" as const,
      };

      const cleanedExistingArticle = {
        publicationUrl: existingArticle.publicationUrl,
        title: existingArticle.title,
        createdAt: existingArticle.createdAt,
        status: existingArticle.status,
        previewImg: existingArticle.previewImg,
        paid: existingArticle.paid,
        description: existingArticle.description,
        publishedAt: existingArticle.publishedAt,
      };
      const doc = await TileDocument.load(client.ceramic, args.streamId);
      const updatedArticle = {
        ...cleanedExistingArticle,
        ...baseArticle,
      };
      await doc.update(updatedArticle);
      await thunkAPI.dispatch(
        articleRegistryActions.update({ ...updatedArticle, text: content })
      );
      await thunkAPI.dispatch(
        addPublishRegistryArticle({ streamId: args.streamId, client })
      );
      return baseArticle;
    } catch (err) {
      console.error(err);
      return thunkAPI.rejectWithValue("Failed to update");
    }
  }
);
