import k from "keccak256";

export function keccak256(...message: (string | Buffer)[]) {
  let hash = Buffer.alloc(0);

  for (const m of message) {
    const msg = Buffer.isBuffer(m) ? m : Buffer.from(m, "utf8");
    hash = Buffer.concat([hash, msg]);
  }

  return k(hash).toString("hex");
}
