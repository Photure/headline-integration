import { useItemsContext } from "context/ItemsContext";
import React, { useCallback } from "react";

const Checkmark = ({ selected }: { selected: boolean }) => (
  <div
    style={
      selected
        ? { left: "4px", top: "4px", position: "absolute", zIndex: "1" }
        : { display: "none" }
    }
  >
    <svg
      style={{ fill: "white", position: "absolute" }}
      width="24px"
      height="24px"
    >
      <circle cx="12.5" cy="12.2" r="8.292" />
    </svg>
    <svg
      style={{ fill: "#06befa", position: "absolute" }}
      width="24px"
      height="24px"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  </div>
);

const imgStyle = {
  transition: "transform .135s cubic-bezier(0.0,0.0,0.2,1),opacity linear .15s",
};
const selectedImgStyle = {
  transform: "translateZ(0px) scale3d(0.9, 0.9, 1)",
  transition: "transform .135s cubic-bezier(0.0,0.0,0.2,1),opacity linear .15s",
};

// type Photo = {

// }

interface SelectableImageProps {
  photo: any;
  margin: string;
  selected: boolean;
  addPhotoToPublication: (photo: any) => void;
  removePhotoFromPublication: (photo: any) => void;
}
export type SelectedImageType = {
  type: string;
  content: [
    {
      type: string;
      attrs: {
        src: string;
        height: string;
        width: string;
        title: string;
        alt: string;
      };
    }
  ];
};

const SelectedImage = ({
  photo,
  margin,
  selected,
  addPhotoToPublication,
  removePhotoFromPublication,
}: SelectableImageProps) => {
  //calculate x,y scale
  const sx = (100 - (30 / photo.width) * 100) / 100;
  const sy = (100 - (30 / photo.height) * 100) / 100;
  selectedImgStyle.transform = `translateZ(0px) scale3d(${sx}, ${sy}, 1)`;
  const { updateSelectedImages } = useItemsContext();
  console.log("selected", selected);
  const convertPhotoToContent = useCallback(() => {
    const content = {
      type: "paragraph",
      content: [
        {
          type: "image",
          attrs: {
            src: photo.src,
            height: photo.height,
            width: photo.width,
            title: photo.name,
            alt: photo.name,
          },
        },
      ],
    };
    return content;
  }, []);

  const handleOnClick = () => {
    console.log("event click", photo.id);
    const content = convertPhotoToContent();
    if (selected) {
      removePhotoFromPublication(content);
    } else {
      addPhotoToPublication(content);
    }
    console.log("before updateSelectedImages");
    updateSelectedImages(photo.id);
  };

  return (
    <div
      style={{
        margin,
        height: photo.height,
        width: photo.width,
        backgroundColor: "#eee",
        cursor: "pointer",
        overflow: "hidden",
        position: "relative",
      }}
      className={!selected ? "not-selected" : ""}
    >
      <Checkmark selected={selected ? true : false} />
      <img
        alt={photo.title}
        style={
          selected ? { ...imgStyle, ...selectedImgStyle } : { ...imgStyle }
        }
        {...photo}
        onClick={handleOnClick}
      />
      <style>{`.not-selected:hover{outline:2px solid #06befa}`}</style>
    </div>
  );
};

export default SelectedImage;
