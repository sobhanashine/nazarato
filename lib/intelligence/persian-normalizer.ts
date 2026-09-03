const ARABIC_TO_PERSIAN_CHARACTERS: Readonly<Record<string, string>> = {
  "ي": "ی",
  "ى": "ی",
  "ك": "ک",
  "ة": "ه",
};

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const DIACRITICS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/gu;
const TATWEEL = /\u0640/gu;
const ZERO_WIDTH_CHARACTERS = /[\u200b\u200d\u2060\ufeff]/gu;
const HALF_SPACE_WITH_PADDING = /\s*\u200c\s*/gu;
const REPEATED_HALF_SPACE = /\u200c{2,}/gu;
const WHITESPACE = /\s+/gu;

function normalizeDigit(character: string): string {
  const arabicIndex = ARABIC_INDIC_DIGITS.indexOf(character);
  if (arabicIndex >= 0) {
    return String(arabicIndex);
  }

  const persianIndex = PERSIAN_DIGITS.indexOf(character);
  if (persianIndex >= 0) {
    return String(persianIndex);
  }

  return character;
}

/**
 * Produces the canonical text used by the baseline and its evidence offsets.
 * Offsets emitted by the analyser always refer to this normalized string, not
 * to the immutable source review.
 */
export function normalizePersianText(input: string): string {
  const canonicalCharacters = Array.from(input.normalize("NFC"), (character) => {
    const mapped = ARABIC_TO_PERSIAN_CHARACTERS[character] ?? character;
    return normalizeDigit(mapped);
  }).join("");

  return canonicalCharacters
    .replace(DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(ZERO_WIDTH_CHARACTERS, "")
    .replace(HALF_SPACE_WITH_PADDING, "‌")
    .replace(REPEATED_HALF_SPACE, "‌")
    .replace(WHITESPACE, " ")
    .trim();
}
