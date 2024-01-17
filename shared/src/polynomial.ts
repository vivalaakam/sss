import { Buffer } from "buffer";
import BN from "bn.js";
import { PolynomialPoint, Share } from "./types";
import { curveN } from "./constants";
import { randomBytes } from "crypto";
import { keccak256 } from "./keccak256";

export class Polynomial {
  shares: BN[];
  polynomialId: string;

  constructor(shares: BN[], polynomialId: string = "") {
    this.shares = shares;
    this.polynomialId = polynomialId;
  }

  static initialize(privateKey: BN | Buffer | null, threshold: number) {
    const pk = privateKey ? privateKey : randomBytes(32);

    const shares = [new BN(pk)];

    for (let i = 1; i < threshold; i += 1) {
      const share = randomBytes(32);
      shares.push(new BN(share));
    }

    const polynomialId = keccak256(...shares.map((bn) => bn.toString()));

    return new Polynomial(shares, polynomialId);
  }

  static fromShares(shares: Share[]) {
    const unsortedPoints = shares.map<PolynomialPoint>((s) => ({
      x: new BN(s.shareIndex, "hex"),
      y: new BN(s.share, "hex"),
    }));
    const sortedPoints = pointSort(unsortedPoints);
    const polynomial = generateEmptyBNArray(sortedPoints.length);
    for (let i = 0; i < sortedPoints.length; i += 1) {
      const coefficients = interpolationPoly(i, sortedPoints);
      for (let k = 0; k < sortedPoints.length; k += 1) {
        let tmp = new BN(sortedPoints[i].y);
        tmp = tmp.mul(coefficients[k]);
        polynomial[k] = polynomial[k].add(tmp).umod(curveN);
      }
    }

    const polynomialId = keccak256(...polynomial.map((bn) => bn.toString()));

    return new Polynomial(polynomial, polynomialId);
  }

  getPrivateKey(): BN {
    return this.shares[0];
  }

  getShare(x: string | BN): Share {
    const tmpX = new BN(x, "hex");
    let xi = new BN(tmpX);
    let sum = new BN(this.shares[0]);
    for (let i = 1; i < this.shares.length; i += 1) {
      sum = sum.add(xi.mul(this.shares[i]));
      xi = xi.mul(tmpX);
    }
    return {
      share: sum.umod(curveN)?.toString("hex")?.padStart?.(64, "0"),
      shareIndex: tmpX.toString("hex"),
      polynomialID: this.polynomialId,
    };
  }
}

const pointSort = (innerPoints: PolynomialPoint[]): PolynomialPoint[] => {
  const pointArrClone = [...innerPoints];
  pointArrClone.sort((a, b) => a.x.cmp(b.x));
  return pointArrClone;
};

const generateEmptyBNArray = (length: number): BN[] =>
  Array.from({ length }, () => new BN(0));

const denominator = (i: number, innerPoints: PolynomialPoint[]) => {
  let result = new BN(1);
  const xi = innerPoints[i].x;
  for (let j = innerPoints.length - 1; j >= 0; j -= 1) {
    if (i !== j) {
      let tmp = new BN(xi);
      tmp = tmp.sub(innerPoints[j].x).umod(curveN);
      result = result.mul(tmp).umod(curveN);
    }
  }
  return result;
};

const interpolationPoly = (i: number, innerPoints: PolynomialPoint[]): BN[] => {
  let coefficients = generateEmptyBNArray(innerPoints.length);
  const d = denominator(i, innerPoints);
  if (d.cmp(new BN(0)) === 0) {
    throw new Error("Denominator for interpolationPoly is 0");
  }
  coefficients[0] = d.invm(curveN);
  for (let k = 0; k < innerPoints.length; k += 1) {
    const newCoefficients = generateEmptyBNArray(innerPoints.length);
    if (k !== i) {
      let j: number;
      if (k < i) {
        j = k + 1;
      } else {
        j = k;
      }
      j -= 1;
      for (; j >= 0; j -= 1) {
        newCoefficients[j + 1] = newCoefficients[j + 1]
          .add(coefficients[j])
          .umod(curveN);
        let tmp = new BN(innerPoints[k].x);
        tmp = tmp.mul(coefficients[j]).umod(curveN);
        newCoefficients[j] = newCoefficients[j].sub(tmp).umod(curveN);
      }
      coefficients = newCoefficients;
    }
  }
  return coefficients;
};
