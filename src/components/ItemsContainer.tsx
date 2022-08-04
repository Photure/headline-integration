import React, { ReactNode, useCallback, useEffect } from "react";
import SelectedImage, { SelectedImageType } from "./SelectableImage";
import Gallery from "react-photo-gallery";
import { useItemsContext } from "../context/ItemsContext";

type Props = {
  children?: ReactNode;
  addPhotoToPublication: (photo: SelectedImageType) => void;
  removePhotoFromPublication: (photo: SelectedImageType) => void;
};

export type image = {
  mediaLink?: string;
  name?: string;
  description?: string;
  src?: string;
  width?: number;
  height?: number;
  id: string;
};

export default function ItemsContainer({
  addPhotoToPublication,
  removePhotoFromPublication,
}: Props) {
  const { selectedImages, getItems } = useItemsContext();
  useEffect(() => {
    getItems();
  }, [getItems]);

  const imageRenderer = useCallback(
    ({ key, photo }: any) => (
      <SelectedImage
        addPhotoToPublication={addPhotoToPublication}
        removePhotoFromPublication={removePhotoFromPublication}
        selected={selectedImages.includes(photo.id)}
        key={key}
        margin={"2px"}
        photo={photo}
      />
    ),
    [selectedImages]
  );
  const { images, loading, error } = useItemsContext();

  const renderGallery = useCallback(() => {
    console.log("in render", images);
    return (
      images?.length > 0 && (
        <Gallery photos={images} renderImage={imageRenderer} />
      )
    );
  }, [images, imageRenderer]);

  console.log("images", images);
  // console.log('selectedItems', selectedItems)
  if (loading) return <h3>Loading...</h3>;
  if (error) return <h3>Error :(</h3>;
  return <div style={{ height: "100%", width: "100%" }}>{renderGallery()}</div>;
}
