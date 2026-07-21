function decodeBase64(payload: string): Uint8Array {
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function decodeGzipJson<T>(payload: string): Promise<T> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('当前浏览器不支持正文数据解压，请使用新版 Chrome 或 Edge。');
  }

  const compressed = decodeBase64(payload);
  const stream = new Blob([compressed as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text()) as T;
}
