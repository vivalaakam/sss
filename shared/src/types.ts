import BN from "bn.js";

export type Share = {
  share: string;
  shareIndex: string;
  polynomialID: string;
};

export type ShareEncrypted = {
  nonce: string;
  shareIndex: string;
  polynomialID: string;
  publicShare: string;
};
export type PolynomialPoint = {
  x: BN;
  y: BN;
  id?: string;
};
