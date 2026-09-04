# Nazarato source snapshots

## `rasht-osm-businesses.json`

This is a bounded, reproducible **candidate** snapshot for the Rasht MVP:

- 25 cafés and 25 restaurants;
- unique normalized names and 50 direct OpenStreetMap element URLs;
- coordinates for every record and normalized Iranian phone numbers where the
  OSM tag is valid;
- no descriptions, ratings, reviews, menus, images, or inferred price bands;
- no inferred neighborhood when OSM does not provide one.

The source is OpenStreetMap data, © OpenStreetMap contributors, available under
the [Open Data Commons Open Database License 1.0](https://www.openstreetmap.org/copyright).
This snapshot and database derivatives of it must retain the required attribution
and comply with ODbL share-alike obligations. Keep the OSM-derived business layer
separable from Nazarato's first-party reviews and intelligence data. This note is
an implementation boundary, not jurisdiction-specific legal advice.

Every snapshot row has `publicationApproved: false`. The importer therefore
keeps all 50 candidates quarantined even though the source license is known.
Publication may be approved only after the product visibly displays
`© OpenStreetMap contributors`, links to the license, and the team has confirmed
how any publicly used derivative database will be offered under ODbL.

The reviewed snapshot was staged in the linked development Supabase project on
2026-09-04 as 50 `pending` businesses and 50 `quarantined` source rows. The
runner defaults to a read-only preflight and refuses active identities,
unexpected provenance, or any publication-enabled input:

```sh
npm run import:rasht-osm -- --dry-run
npm run import:rasht-osm -- --apply-quarantined
```

The apply mode performs a postflight assertion. A repeated apply must report
zero new businesses and zero new sources; publication still requires a separate
reviewed workflow that this runner intentionally does not provide.

The capture uses one small Overpass query over the bounding box stored in the
manifest. It does not use Google Maps, Neshan, Balad, Bilbooard, Digikala,
Basalam, or marketplace reviews as a data source.

Refresh manually—never on a high-frequency schedule against a public instance:

```sh
node --experimental-strip-types scripts/fetch-rasht-osm-businesses.mts
```

The command prints JSON to stdout for review. A refresh is not accepted until
the snapshot tests pass and the diff is manually checked for duplicates,
mistagged places, or suspicious contact changes.
