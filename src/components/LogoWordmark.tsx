import React from "react";
import styled from "styled-components";
import logoWordmark from "assets/photure - spelled 1.svg";

type Props = {
  className?: string;
};

const Logo = styled.img`
  width: 100%;
`;

const LogoWordmark = ({ className }: Props) => {
  return (
    <Logo className={className} src={logoWordmark} alt="Web3 newsletter Logo" />
  );
};

export default LogoWordmark;
