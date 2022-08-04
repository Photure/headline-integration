import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { image } from "../components/ItemsContainer";
import { convertFileNameToURIEncoded } from "../utils";
import reactImageSize from "react-image-size";
import { gql, useLazyQuery } from "@apollo/client";
import { useWallet } from "@alexkeating/quiver";

export const ItemsContext = createContext({});

type DimensionsType = { id: string; height: number; width: number };

export const ItemsProvider = (props: { children: React.ReactNode }): any => {
  const { address: usersWalletAddress } = useWallet();
  const [images, setImages] = useState<any[]>([]);
  const [dimensions, setDimensions] = useState<DimensionsType[]>([]);
  const updateDimensions = useCallback(
    (value: DimensionsType) => {
      const newDimensions = [...dimensions, value];
      setDimensions(newDimensions);
    },
    [dimensions]
  );
  const offset = 0;
  const limit = 1000;
  // const [selectedItems, setSelectedItems] = useState<any[]>([])
  const GET_PROFILE = gql`
    query GetProfile($usersWalletAddress: String, $offset: Int, $limit: Int) {
      tokens(
        orderBy: blockNumber
        orderDirection: desc
        skip: $offset
        first: $limit
        where: { owner_of: $usersWalletAddress }
      ) {
        id
        name
        description
        owner_of
        mediaLink
        timestamp
        filetype
        tag
      }
    }
  `;
  const memoizedQuery = useMemo(() => GET_PROFILE, [GET_PROFILE]);
  const [fetchItems, { data, loading, error, fetchMore }] = useLazyQuery(
    memoizedQuery,
    {
      variables: {
        offset,
        limit,
        usersWalletAddress: usersWalletAddress?.toLowerCase(),
      },
      fetchPolicy: "network-only",
    }
  );

  const getDimensions = useCallback(async (tokens: any) => {
    const newDimensions: DimensionsType[] = [];
    console.log("in getDimensions", tokens);
    if (tokens) {
      for (let i = 0; i < tokens.length; i++) {
        const { id, mediaLink, filetype } = tokens[i];
        const isVideo = filetype === "video";
        const convertedMediaLink = convertFileNameToURIEncoded(
          mediaLink,
          isVideo
        );
        const { height, width } = await reactImageSize(convertedMediaLink);
        newDimensions.push({ id, height, width });
      }
    }
    // setDimensions(newDimensions)
    return newDimensions;
  }, []);

  const mergeDimensionsToImages = useCallback(
    async (dimensions: any, tokens: any) => {
      const newImages: image[] = [];
      for (let i = 0; i < dimensions.length; i++) {
        const image = tokens.find(
          (image: any) => image.id === dimensions[i].id
        );
        if (image) {
          const newImage = {
            ...image,
            ...dimensions[i],
            src: convertFileNameToURIEncoded(
              image.mediaLink,
              image.filetype === "video"
            ),
          };
          newImages.push(newImage);
        }
      }
      console.log("newImages", newImages);
      return newImages;
    },
    []
  );

  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const updateSelectedImages = useCallback(
    (imagePressed: string) => {
      console.log("imagePressed", imagePressed, selectedImages);
      const isAdd = !selectedImages.includes(imagePressed);
      console.log("isAdd", isAdd);
      if (isAdd) {
        const newSelectedImages = [...selectedImages, imagePressed];
        setSelectedImages(newSelectedImages);
      } else {
        const newSelectedImages = selectedImages.filter(
          (image) => image !== imagePressed
        );
        setSelectedImages(newSelectedImages);
      }
    },
    [selectedImages]
  );

  const getItems = useCallback(async () => {
    fetchItems({
      variables: {
        offset,
        limit,
        usersWalletAddress: usersWalletAddress?.toLowerCase(),
      },
    }).then(async (result) => {
      const { tokens } = result.data;
      const dimensions = await getDimensions(tokens);
      const mergedImages = await mergeDimensionsToImages(dimensions, tokens);
      setImages(mergedImages);
    });
  }, [fetchItems, getDimensions, mergeDimensionsToImages, usersWalletAddress]);
  const getMoreItems = useCallback(async () => {
    fetchMore({
      variables: {
        offset: images.length,
        limit,
        usersWalletAddress: usersWalletAddress?.toLowerCase(),
      },
    }).then(async (result) => {
      const { tokens } = result.data;
      const dimensions = await getDimensions(tokens);
      const mergedImages = await mergeDimensionsToImages(dimensions, tokens);
      setImages([...images, ...mergedImages]);
    });
  }, [
    fetchMore,
    getDimensions,
    mergeDimensionsToImages,
    images,
    usersWalletAddress,
  ]);
  // useEffect(
  //   () => () => {
  //     fetchItems({
  //       variables: {
  //         offset,
  //         limit,
  //         usersWalletAddress: usersWalletAddress?.toLowerCase(),
  //       },
  //     }).then(async (result) => {
  //       const { tokens } = result.data;
  //       const dimensions = await getDimensions(tokens);
  //       const mergedImages = await mergeDimensionsToImages(dimensions, tokens);
  //       setImages(mergedImages);
  //     });
  //   },
  //   [fetchItems, getDimensions, mergeDimensionsToImages, usersWalletAddress]
  // );

  const acceptedValue = useMemo(
    () => ({
      images,
      loading,
      error,
      selectedImages,
      updateSelectedImages,
      getItems,
      getMoreItems,
    }),
    [
      images,
      loading,
      error,
      selectedImages,
      updateSelectedImages,
      getItems,
      getMoreItems,
    ]
  );
  return (
    <ItemsContext.Provider value={acceptedValue}>
      {props.children}
    </ItemsContext.Provider>
  );
};

export const useItemsContext: any = () => useContext(ItemsContext);
