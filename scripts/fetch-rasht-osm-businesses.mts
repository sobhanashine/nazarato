/**
 * Fetch a bounded OpenStreetMap snapshot for the Rasht MVP.
 *
 * Run manually (do not schedule against the public instance):
 *   node --experimental-strip-types scripts/fetch-rasht-osm-businesses.mts
 *
 * The script prints JSON to stdout. It never writes to the database and never
 * copies descriptions, ratings, reviews, images, or menus.
 */

type JsonRecord = Record<string, unknown>;

type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

type Candidate = {
  id: string;
  amenity: "cafe" | "restaurant";
  name: string;
  latitude: number;
  longitude: number;
  neighborhood?: string;
  contact: Record<string, string>;
};

const endpoint =
  process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";
const bbox = [37.22, 49.5, 37.36, 49.69] as const;
const query = `[out:json][timeout:25];
nwr["amenity"~"^(cafe|restaurant)$"]["name"](${bbox.join(",")});
out center tags;`;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

function duplicateKey(value: string): string {
  return normalizeText(value)
    .replace(/^(کافه رستوران|کافه|رستوران|کافی شاپ|کبابی)\s+/u, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLocaleLowerCase("fa-IR");
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function asciiDigits(value: string): string {
  return Array.from(value, (character) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(character);
    if (persianIndex >= 0) return String(persianIndex);
    const arabicIndex = ARABIC_DIGITS.indexOf(character);
    if (arabicIndex >= 0) return String(arabicIndex);
    return character;
  }).join("");
}

function normalizeOneIranianPhone(value: string): string | null {
  let phone = asciiDigits(value).replace(/[^\d+]/g, "");
  if (phone.startsWith("0098")) phone = `+98${phone.slice(4)}`;
  if (phone.startsWith("98") && !phone.startsWith("+")) phone = `+${phone}`;
  if (phone.startsWith("0")) phone = `+98${phone.slice(1)}`;
  if (!/^\+98\d{10}$/.test(phone)) return null;
  return phone;
}

function normalizePhones(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const phones = value
    .split(/[;,/]/)
    .map(normalizeOneIranianPhone)
    .filter((phone): phone is string => phone !== null);
  const unique = [...new Set(phones)];
  return unique.length > 0 ? unique.join(";") : undefined;
}

function instagramHandle(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  const urlMatch = normalized.match(/instagram\.com\/([^/?#]+)/i);
  const candidate = (urlMatch?.[1] ?? normalized).replace(/^@/, "");
  return /^[a-z0-9._]{1,30}$/i.test(candidate) ? candidate : undefined;
}

function validHttpUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function makeAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:place"],
  ]
    .filter((part): part is string => Boolean(part))
    .map(normalizeText);
  return parts.length > 0 ? [...new Set(parts)].join("، ") : undefined;
}

function toCandidate(element: OsmElement): Candidate | null {
  const tags = element.tags ?? {};
  const amenity = tags.amenity;
  const name = tags["name:fa"] ?? tags.name;
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (
    (amenity !== "cafe" && amenity !== "restaurant") ||
    !name ||
    latitude === undefined ||
    longitude === undefined
  ) {
    return null;
  }

  const phone = normalizePhones(tags["contact:phone"] ?? tags.phone);
  const rawWebsite = tags["contact:website"] ?? tags.website;
  const directInstagram = tags["contact:instagram"] ?? tags.instagram;
  const instagram = instagramHandle(
    directInstagram ?? (rawWebsite?.includes("instagram.com") ? rawWebsite : undefined),
  );
  const website = rawWebsite?.includes("instagram.com")
    ? undefined
    : validHttpUrl(rawWebsite);
  const address = makeAddress(tags);
  const contact = Object.fromEntries(
    Object.entries({ phone, website, instagram, address }).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  const neighborhood = tags["addr:suburb"] ?? tags["addr:neighbourhood"];

  return {
    id: `${element.type}/${element.id}`,
    amenity,
    name: normalizeText(name),
    latitude,
    longitude,
    ...(neighborhood ? { neighborhood: normalizeText(neighborhood) } : {}),
    contact,
  };
}

function contactScore(candidate: Candidate): number {
  return (
    (candidate.contact.phone ? 4 : 0) +
    (candidate.contact.website ? 2 : 0) +
    (candidate.contact.instagram ? 2 : 0) +
    (candidate.contact.address ? 1 : 0) +
    (candidate.neighborhood ? 1 : 0)
  );
}

function chooseCandidates(candidates: Candidate[]): Candidate[] {
  const byBestName = new Map<string, Candidate>();
  for (const candidate of candidates) {
    const key = duplicateKey(candidate.name);
    const current = byBestName.get(key);
    if (
      !current ||
      contactScore(candidate) > contactScore(current) ||
      (contactScore(candidate) === contactScore(current) && candidate.id < current.id)
    ) {
      byBestName.set(key, candidate);
    }
  }

  const ranked = [...byBestName.values()].sort(
    (left, right) =>
      contactScore(right) - contactScore(left) || left.id.localeCompare(right.id),
  );
  return [
    ...ranked.filter((candidate) => candidate.amenity === "cafe").slice(0, 25),
    ...ranked
      .filter((candidate) => candidate.amenity === "restaurant")
      .slice(0, 25),
  ];
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    "user-agent": "Nazarato-MVP-Research/0.1 (local development)",
  },
  body: new URLSearchParams({ data: query }),
});
if (!response.ok) {
  throw new Error(`Overpass request failed with status ${response.status}.`);
}

const payload: unknown = await response.json();
if (!isRecord(payload) || !Array.isArray(payload.elements)) {
  throw new Error("Unexpected Overpass response shape.");
}
const elements = payload.elements.filter((element): element is OsmElement => {
  if (!isRecord(element) || typeof element.id !== "number") return false;
  return element.type === "node" || element.type === "way" || element.type === "relation";
});
const candidates = elements
  .map(toCandidate)
  .filter((candidate): candidate is Candidate => candidate !== null);
const selected = chooseCandidates(candidates);
if (selected.length !== 50) {
  throw new Error(`Expected 50 selected businesses, received ${selected.length}.`);
}

const timestamp =
  isRecord(payload.osm3s) && typeof payload.osm3s.timestamp_osm_base === "string"
    ? payload.osm3s.timestamp_osm_base
    : new Date().toISOString();
const imports = selected.map((candidate) => ({
  business: {
    slug: `rasht-osm-${candidate.id.replace("/", "-")}`,
    name: candidate.name,
    categorySlug: candidate.amenity,
    city: "رشت",
    ...(candidate.neighborhood
      ? { neighborhoodSlug: candidate.neighborhood }
      : {}),
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    ...(Object.keys(candidate.contact).length > 0
      ? { contact: candidate.contact }
      : {}),
  },
  source: {
    sourceType: "open_dataset",
    sourceRef: `https://www.openstreetmap.org/${candidate.id}`,
    permissionBasis: "open_license",
    licenseName: "ODbL-1.0",
    licenseUrl: "https://www.openstreetmap.org/copyright",
    attributionText: "© OpenStreetMap contributors",
    publicationApproved: false,
    capturedAt: timestamp,
  },
}));

console.log(
  JSON.stringify(
    {
      manifest: {
        source: "OpenStreetMap contributors",
        sourceUrl: "https://www.openstreetmap.org",
        license: "ODbL-1.0",
        licenseUrl: "https://www.openstreetmap.org/copyright",
        attribution: "© OpenStreetMap contributors",
        endpoint,
        bbox,
        capturedAt: timestamp,
        selection: "25 cafes + 25 restaurants; unique normalized names; contact-rich records first",
        candidateCount: candidates.length,
        selectedCount: imports.length,
      },
      imports,
    },
    null,
    2,
  ),
);
