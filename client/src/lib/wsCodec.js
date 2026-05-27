import { decode, encode } from "@msgpack/msgpack";

export function encodeMessage(message) {
  return encode(message);
}

export async function decodeMessage(data) {
  if (data instanceof ArrayBuffer) {
    return decode(new Uint8Array(data));
  }

  if (data instanceof Blob) {
    return decode(new Uint8Array(await data.arrayBuffer()));
  }

  return decode(data);
}
