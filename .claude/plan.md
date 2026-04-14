# Plan: Per-Building Schedule + Override Chain + CSS Migration

## Overview

Three changes:

1. **CSS Migration** — Move injected styles from 3 modal JS files into separate `.css` files
2. **Per-Building Schedule** — Look up a building's `support-schedule` field from the `buildings` DB, and use it instead of `"default-schedule"` when present
3. **Override Chain** — Backend recursively follows the `over-ride` field on schedule documents until it reaches one with no valid override, with safety limits

---

## 1. CSS Migration (3 modals → separate `.css` files)

### Files to create:

- `cherry/components/helpModal/helpModal.css` — extracted from `helpModal.js:_injectStyles()`
- `cherry/components/independentAudioModal/independentAudioModal.css` — extracted from `independentAudioModal.js:_injectStyles()`
- `cherry/components/streamInputsModal/streamInputsModal.css` — extracted from `streamInputsModal.js:_injectStyles()`

### Files to modify:

- `cherry/components/helpModal/helpModal.js` — remove `_injectStyles()` method and calls to it
- `cherry/components/independentAudioModal/independentAudioModal.js` — remove `_injectStyles()` method and calls to it
- `cherry/components/streamInputsModal/streamInputsModal.js` — remove `_injectStyles()` method and calls to it
- `cherry/index.html` — add `<link rel="stylesheet">` tags for the 3 new CSS files

---

## 2. Per-Building Schedule Lookup

### Goal:

When the room's building has a `support-schedule` field in its CouchDB document, use that schedule ID instead of `"default-schedule"`.

### Files to modify:

**`structs/building.go`** — Add optional field:

```go
SupportSchedule string `json:"support-schedule,omitempty"`
```

**`handlers/handlers.go`** — Modify `GetHelpSchedule`:

- Parse `SYSTEM_ID` to extract building ID (first segment of `BLDG-ROOM-CP1`)
- Fetch the building document via `db.GetDB().GetBuilding(buildingID)`
- If the building has a non-empty `SupportSchedule`, use that as the schedule ID
- Otherwise fall back to `"default-schedule"`
- Still allow `?id=` query param to override everything (for testing/debugging)

---

## 3. Override Chain Resolution

### Goal:

After determining the schedule ID (from building or default), fetch the schedule, check its `over-ride` field. If it points to another valid schedule, follow it. Repeat until no valid override exists. Use the last successfully fetched schedule.

### Files to modify:

**`handlers/handlers.go`** — Add `resolveSchedule` helper:

```go
func resolveSchedule(startID string, maxDepth int) (structs.HelpSchedule, error)
```

- Fetch schedule by `startID`
- If `schedule.Override` is non-empty, try to fetch that schedule
    - If fetch succeeds → recurse (up to `maxDepth`, e.g., 10)
    - If fetch fails (schedule doesn't exist) → return the current schedule (last valid one)
- If `schedule.Override` is empty → return current schedule
- Safety: cap at `maxDepth` iterations to prevent infinite loops

**`GetHelpSchedule` handler** — Updated flow:

1. If `?id=` query param is set, use that as startID
2. Else, look up building → use `building.SupportSchedule` if present
3. Else, use `"default-schedule"`
4. Call `resolveSchedule(startID, 10)` to follow the override chain
5. Return the final resolved schedule

---

## Summary of all file changes:

| File                                                                | Change                                                                                  |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `structs/building.go`                                               | Add `SupportSchedule` field                                                             |
| `handlers/handlers.go`                                              | Add `resolveSchedule()`, update `GetHelpSchedule` with building lookup + override chain |
| `cherry/components/helpModal/helpModal.css`                         | **NEW** — extracted CSS                                                                 |
| `cherry/components/independentAudioModal/independentAudioModal.css` | **NEW** — extracted CSS                                                                 |
| `cherry/components/streamInputsModal/streamInputsModal.css`         | **NEW** — extracted CSS                                                                 |
| `cherry/components/helpModal/helpModal.js`                          | Remove `_injectStyles()`                                                                |
| `cherry/components/independentAudioModal/independentAudioModal.js`  | Remove `_injectStyles()`                                                                |
| `cherry/components/streamInputsModal/streamInputsModal.js`          | Remove `_injectStyles()`                                                                |
| `cherry/index.html`                                                 | Add 3 `<link>` stylesheet tags                                                          |

No changes to the frontend JS schedule logic — the backend returns the fully resolved schedule, and the frontend consumes it as before.
