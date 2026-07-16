export const MAX_TEXT_LENGTH = 50_000;

export function validateTextShare(text: string) {
  if (!text || !text.trim()) {
    throw new Error("Text cannot be empty");
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error("Text too long");
  }
}