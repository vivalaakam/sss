import {Polynomial} from "../polynomial";
import BN from "bn.js";

describe("Polynomial", () => {
  it("should make polynomial with one message", () => {
    const poly = Polynomial.initialize(
      new BN(
        "c23e1e4937ba39fef35b2cbe400bd3065b58b8a7b204fac53e8791ef9a234fdd",
        "hex",
      ),
      2,
    );

    expect(poly.getPrivateKey().toString("hex")).toEqual(
      "c23e1e4937ba39fef35b2cbe400bd3065b58b8a7b204fac53e8791ef9a234fdd",
    );

    const share1 = poly.getShare(new BN("14", "hex"));
    const share2 = poly.getShare(new BN("aa", "hex"));
    const share3 = poly.getShare(new BN("ff", "hex"));

    const variants = [
      [share1, share2],
      [share2, share1],
      [share1, share3],
      [share2, share3],
      [share1, share2, share3],
    ];

    for (const v of variants) {
      const p = Polynomial.fromShares(v);
      expect(p.getPrivateKey().toString("hex")).toEqual(
        "c23e1e4937ba39fef35b2cbe400bd3065b58b8a7b204fac53e8791ef9a234fdd",
      );
    }
  });
});
