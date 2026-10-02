# Spec: local discovery and current production release

Authorized on 2026-10-02 after the founder accepted the 2026-10-01 proposal. The same Supabase database remains; test data must be separated. Voice input is removed. There is no WordPress installation.

**Problem.** A local visitor needs a cafe list without typing a business name. The current category filter has no independent area, and absent catalogs fall back to sample businesses.

**User action.** The home/search page shows the explicit Rasht starting area. Choose Rasht, Golsar and surroundings, Imam Ali, Tohid, or all supplied areas. Click cafe to open its local list, then a profile. A new text search, sort and pagination retain the area. Explicit URL choices override a remembered browser choice. No device location or login is required.

**Data changes.** Read a validated area cookie, set only that preference in the browser. Public catalog reads active/merged businesses with approved business_sources, projects safe fields and never falls back to fixtures. The ignored Golsar snapshot remains local. No schema changes or destructive cleanup are required for this slice.

**Failure modes.** Invalid area/cookie defaults to Rasht. Disabled cookie storage still leaves working explicit URLs. Missing/failed/unapproved catalog gives an honest empty state. Unsupported location has no fabricated results; all supplied areas can be selected manually.

**Out of scope.** Automatic geolocation, maps, real SMS before provider configuration, imported Google opinions/photos, private snapshot publication, owner verification claims.

**Done when.** Area+category and preference retention work on mobile and desktop; voice control is removed and old audio requests return 410; tests/build pass and the exact main SHA is publicly verified on nazarato.ir. Remaining service/data inputs are listed together.
