# Three-Way Match Engine — PO, GRN &amp; Invoice Reconciliation

A full-stack application that lets users upload Purchase Order (PO), Goods Receipt Note (GRN),
and Invoice documents, extracts structured data with the Gemini API, resolves line items against
a SKU Master catalogue, and performs a three-way match — surfaced through a UI modeled on the
provided reference screenshots.

```
three-way-match-engine/
├── backend/     Node.js + Express + MongoDB + Gemini
└── frontend/    Next.js (App Router) + Tailwind CSS + TanStack Query
```

---

## 1. Setup &amp; Run

### Prerequisites
- Node.js 18+
- A running MongoDB instance (local or Atlas)
- A Gemini API key ([Google AI Studio](https://aistudio.google.com/apikey))

### Backend

```bash
cd backend
cp .env.example .env      # fill in MONGODB_URI, GEMINI_API_KEY, JWT_SECRET
npm install
npm run seed               # optional — seeds 5 sample SKU Master records
npm run dev                 # http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local  # NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev                 # http://localhost:3000
```

Log in with the credentials from `backend/.env` (`AUTH_USERNAME` / `AUTH_PASSWORD`, default
`admin` / `admin123`).

### API docs
- Postman collection: `backend/postman_collection.json`
- Sample outputs: `samples/` (parsed JSON, a `GET /match/:poNumber` result, a `GET
  /summary/:poNumber` result)

---

## 2. Approach

The pipeline is intentionally a sequence of **plain functions**, not a plugin/engine
abstraction — this is a 5–6 day assignment, not a platform:

```
upload → gemini.extractDocument → parsing.validateExtractedDocument
       → masterResolution.resolveItems → Model.save() → duplication.checkDuplication
       → audit.logStep (after every stage)
```

Every document is persisted independently of whether a PO exists yet for its `poNumber`
(out-of-order uploads), and duplicates are **stored, not rejected** (surfaced as a warning
instead). `GET /match/:poNumber` never reads a cache — it recomputes from whatever is currently
in MongoDB, every time.

---

## 3. Data Model

Matches the spec exactly (`backend/src/models/`):

- **SkuMaster** — `skuErpCode` (unique), `name`, `eanCode`, `hsnCode`, `uom`, `agreedRate`,
  `mrp`, `priceTolerance`.
- **PurchaseOrder / Grn / Invoice** — each stores `items[]` with the resolved `skuMaster` ref,
  the raw `itemCode`/`normalizedCode`, an `unmappedMasterSku` flag, and the untouched
  `rawParsed` Gemini output for debugging.
- **MatchAudit** — one document per `poNumber`, `steps[]` appended on every pipeline stage.

**Deliberate deviation from a naive reading of the spec:** `poNumber` / `grnNumber` /
`invoiceNumber` are **not** unique indexes at the DB level. The spec requires that a duplicate PO
"store it anyway, don't overwrite" — a unique index would make that impossible. Uniqueness is
instead a *business rule* enforced by `duplication.service.js` (at upload time, informational)
and recomputed live by `matching.service.js` (at read time, authoritative).

---

## 4. Parsing Flow

1. `multer` stores the raw file to `backend/uploads/` and the type is validated (`po`/`grn`/`invoice`).
2. `gemini.service.js` sends the file + a document-type-specific prompt to Gemini, requesting
   `application/json` output. On malformed JSON it **retries once**, then throws.
3. `parsing.service.js` validates the minimum required fields per the spec's table and throws a
   clear `422` if anything is missing — Gemini output is treated as **untrusted input** and never
   partially persisted.
4. `masterResolution.service.js` resolves every item: `skuErpCode == itemCode` → fallback
   `eanCode == itemCode` → otherwise `unmappedMasterSku: true` (never dropped).
5. The document is saved regardless of whether a PO for that `poNumber` exists yet.
6. `duplication.service.js` runs *after* persistence and only flags — it never blocks storage.

---

## 5. Matching Key Rationale

Every item is keyed by **`sku:<SkuMaster._id>`** when resolved, or **`code:<normalizedItemCode>`**
when it isn't. This means:

- Two lines that read `BIK-BIKANERI-200G` (PO) and `Bikaji Bikaneri Bhujia 200 G Pp` (GRN, same
  `skuErpCode`) collapse to the same key and compare correctly.
- An item that can't be resolved to any SKU Master still gets a stable key (its own normalized
  code) so it can be compared across documents and flagged with `unmapped_master_sku` — it never
  silently vanishes from the grid.

---

## 6. Matching Logic

`matching.service.js` runs on every `GET /match/:poNumber`:

1. Fetch **all** PO/GRN/Invoice documents currently stored for the `poNumber`.
2. If any of the three types is completely absent → `insufficient_documents` (missing types are
   *not* treated as zero quantity — the match simply isn't attempted yet).
3. The **canonical PO** for quantity/date baselines is the earliest-uploaded one. Any additional
   PO for the same number is stored and flags `duplicate_po`, but doesn't get summed into the
   baseline (two POs can't both define "the" ordered quantity).
4. Items are aggregated by matching key, summing quantities across multiple lines/documents of
   the same type (e.g. two GRNs against one PO).
5. Item-level reason codes are computed (`grn_qty_exceeds_po_qty`, `invoice_qty_exceeds_grn_qty`,
   `invoice_qty_exceeds_po_qty`, `item_missing_in_po`, `price_mismatch`, `mrp_mismatch`,
   `unmapped_master_sku`), plus document-level ones (`invoice_date_after_po_date`,
   `duplicate_po`, `duplicate_document`).
6. Status rollup: **mismatch** (any hard violation) → **partially_matched** (soft warnings, or
   quantities not yet fully reconciled — e.g. a partial delivery) → **matched** (fully
   reconciled, zero reasons).
7. Divide-by-zero guards: price/MRP comparisons are skipped (not flagged) when the SKU Master's
   `agreedRate`/`mrp` is zero, or when the document didn't report a rate/MRP at all — a missing
   value never *by itself* produces a mismatch, per spec.

---

## 7. Out-of-Order &amp; Duplicate Handling

- **Out-of-order:** documents link by the `poNumber` *string*, never a foreign key to an existing
  PO document — every collection is independently storable. An Invoice uploaded before its PO
  exists just sits with `insufficient_documents` until the PO (and GRN) arrive; no re-upload is
  needed, the next `GET /match` picks it up automatically.
- **Duplicates:** `duplicate_po` / `duplicate_document` are recomputed live from what's in the DB
  (count > 1 for the same key), not from a flag set at upload time — so even if the audit log is
  lost, the match status is still correct.

---

## 8. Frontend Architecture &amp; State Management

**Chosen: TanStack Query.** The backend is the source of truth and every meaningful read
(`/match`, `/summary`, `/documents`) is *recomputed server-side* — there's no client-owned
derived state to keep in sync via reducers. Query's cache + `invalidateQueries` model maps
directly onto "upload a document → invalidate match/summary/documents for that PO → refetch,"
which is simpler than hand-rolling that in Redux. Local-only UI state (active tab, open modal)
stays in plain `useState`.

- `app/` — App Router pages: `/login`, `/` (PO list), `/po/[poNumber]` (the main workspace with
  the four tabs), `/masters` (SKU Master CRUD).
- `components/` — presentational pieces (`ItemGrid`, `DocItemsTable`, `DocumentForm`,
  `FilePreview`, `TopTabs`/`SubTabPills`, `MismatchBanner`, `StatCard`, `StatusBadge`,
  `UploadModal`, `SkuMasterTable`).
- `hooks/` — one hook per resource (`useMatch`, `useSummary`, `useDocumentsList`,
  `useUploadDocument`, `useSkuMasters` CRUD).
- `lib/api.ts` — the fetch wrapper/interceptor: attaches the Bearer token, normalizes errors,
  and redirects to `/login` on `401`.
- File previews are fetched as authenticated **blobs** and rendered via `URL.createObjectURL`,
  since a plain `<iframe src="...">` can't carry an `Authorization` header.

---

## 9. Assumptions

- Local disk storage for uploaded files (no cloud blob storage).
- Mock auth: a single static username/password pair issuing a signed JWT "Bearer token" — no
  real identity provider.
- **Summary tab valuation** (not fully specified by the spec): PO Amount and Total Received are
  valued at each item's `SkuMaster.agreedRate` (POs/GRNs don't carry a price field in the data
  model); Total Invoiced uses each invoice line's own `unitRate`, falling back to `agreedRate`
  when the invoice line omitted it.
- MRP tolerance is fixed at ~1% per the spec's "mrp_mismatch" rule text.
- Units are assumed comparable across PO/GRN/Invoice (UOM conversion is explicitly out of scope
  per the spec).

---

## 10. Tradeoffs &amp; Known Limitations

- No real-time (WebSocket) status updates — the frontend refetches on mutation and on tab focus
  is disabled to avoid noisy background reloads during a review/demo.
- The SKU Master catalogue is loaded in full on every resolution call rather than queried
  per-item; fine at catalogue sizes in the hundreds/low-thousands, would need indexed
  per-item lookups (or a cache) at real ERP scale.
- The "Associated Invoice & GRN" summary table's per-row `status` is the document's lifecycle
  label (Raised/Received/Invoiced), not a per-document match verdict — only the final "Current
  Status" row carries the actual match status, per the reference screenshot's layout.
- No optimistic UI updates on upload — the modal blocks on the real Gemini round trip; a "real
  (non-visual) upload progress" bar (uploading → parsing → mapping → matched) is listed as a
  bonus in the spec and was left out for time.
- Multer's 1.x line has known CVEs (noted at `npm install` time); acceptable for an assignment,
  would pin to 2.x for anything production-bound.

## What I'd Improve With More Time

- Swagger/OpenAPI spec generated from the route handlers (Postman collection is provided instead).
- Real progress states (uploading/parsing/mapping) driven by SSE or polling instead of a single
  blocking request.
- Optimistic SKU Master edits.
- Bulk PDF page splitting for multi-invoice files.

## AI Tools Used

Built with Claude (Anthropic) for scaffolding, the matching-engine logic, and the frontend
components, with manual review and adjustment of the matching rules, data model, and API
contracts against the spec.
