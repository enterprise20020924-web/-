export const TUCAO_SPEAKER = '泉此方';
const TUCAO_BLOCK = /<tucao\b[^>]*>([\s\S]*?)<\/tucao\s*>/gi;

/** Keep a cameo whole, including quotes and paragraph breaks, through the normal parser. */
export function maskTucaoBlocks(text: string) {
  const blocks = new Map<string, string>();
  const content = text.replace(TUCAO_BLOCK, (_match, body: string) => {
    const token = `\uE000AMAMI_TUCAO_${blocks.size}\uE001`;
    blocks.set(token, body.trim());
    return `\n\n${token}\n\n`;
  });
  return { content, blocks };
}

export function cleanTextKeepingTucao(text: string, clean: (value: string) => string) {
  const { content, blocks } = maskTucaoBlocks(text);
  let result = clean(content);
  for (const [token, body] of blocks) {
    const cleanedBody = clean(body);
    result = result.replace(token, cleanedBody ? `<tucao>${cleanedBody}</tucao>` : '');
  }
  return result.trim();
}
