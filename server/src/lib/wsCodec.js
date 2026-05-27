import { decode, encode } from "@msgpack/msgpack";

export function encodeMessage(message) {
  return encode(message);
}

export function decodeMessage(rawData) {
  if (rawData instanceof ArrayBuffer) {
    return decode(new Uint8Array(rawData));
  }

  if (Array.isArray(rawData)) {
    return decode(Uint8Array.from(rawData));
  }

  if (Buffer.isBuffer(rawData)) {
    return decode(rawData);
  }

  return decode(new Uint8Array(rawData));
}
