import {keccak256} from "../keccak256";

describe("keccak256", () => {
  it("should make hash with one message", () => {
    const message = "Hello World!";
    const hash = keccak256(message);
    expect(hash).toBe(
      "3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0",
    );
  });

  it("should make hash with few messages", () => {
    const message = "Hello World!";
    const hash = keccak256(message, message);
    expect(hash).toBe(
      "388128a274b050fae0de4ef877a4bab2c5d961fb2ac1ab15bc6a5620875c6982",
    );
  });
});
