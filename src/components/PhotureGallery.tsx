import React, { useState } from "react";
import styled from "styled-components";
import Button from "components/Button";
import { Dialog, DialogContainer } from "components/Dialog";
import Icon from "components/Icon";
import photureP from "assets/photureP.svg";
import ItemsContainer from "./ItemsContainer";
import { SelectedImageType } from "./SelectableImage";

const StyledIconButton = styled(Button)`
  margin-top: 1rem;
  margin-bottom: 1rem;
  height: auto;
  border: none;
  outline: none;
`;

const StyledIcon = styled(Icon)`
  padding: 1rem;
  height: auto;
  border: none;
  outline: none;
`;

export const PhotureComponent = ({
  addPhotoToPublication,
  removePhotoFromPublication,
}: {
  addPhotoToPublication: (photo: SelectedImageType) => void;
  removePhotoFromPublication: (photo: SelectedImageType) => void;
}) => {
  const [hide, setHide] = useState(true);

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
          <StyledIcon size="md" src={photureP} alt="settings button" />
        </StyledIconButton>
      }
    >
      <DialogContainer>
        <ItemsContainer
          addPhotoToPublication={addPhotoToPublication}
          removePhotoFromPublication={removePhotoFromPublication}
        />
      </DialogContainer>
    </Dialog>
  );
};
