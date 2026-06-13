import { decode, encode } from "@msgpack/msgpack";

/**
 * Encodes a JSON payload into a binary MessagePack format.
 */
export function encodeMessage(message) {
  return encode(message);
}

/**
 * Decodes a binary MessagePack payload back into a JS object.
 * Handles raw ArrayBuffers, Blobs, and Uint8Arrays.
 */
export async function decodeMessage(data) {
  if (data instanceof ArrayBuffer) {
    return decode(new Uint8Array(data));
  }

  if (data instanceof Blob) {
    return decode(new Uint8Array(await data.arrayBuffer()));
  }

  return decode(data);
}
