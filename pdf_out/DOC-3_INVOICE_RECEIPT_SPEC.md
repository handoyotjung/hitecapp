# DOC-3: Commercial Invoice PDF clean-up + new Receipt PDF

**Brain:** Claude · **Hand:** Anti (build) · **QA:** Cody · **Approver:** Ohan
**Repo:** HitecERP-dashboard (backup `handoyotjung/hitecerp`, base `e54fba9`)
**Target output:** Ohan approved these two PDFs as correct on 2026-09-27. They're in `hitecapp` branch `claude/hopeful-pasteur-iryirf`, folder `pdf_out/`:
- `Invoice_008-INV-HTP-0926_LPSK.pdf`: the invoice the ERP must produce
- `Receipt_001-R-HTP-0926_LPSK.pdf`: the receipt the ERP must produce

The ERP export has to match these PDFs. Where this spec and the PDFs disagree, the PDFs win.

---

## 0. Scope rules (read first)

- Change **only** the Commercial Invoice export (`renderInvoicePdfDirect` in `js/invoices.js`) and add the new Receipt export.
- **Do not edit the shared helpers**: `letterheadHeaderHtml`, `buildStampSignatureHtml`, `drawPageFooters`, `resolveDocLineItems` (all in `js/quoter.js`). The Proforma, Quotation, DO, BAST and Supplier PO exports also use them and must not change.
- Leave the DP / Settlement breakdown (`dpBreakdown`) calculations alone. Only recolor that block (rule R2).
- Don't deploy. Report in the usual compact format.

---

## Part A: Commercial Invoice PDF (`renderInvoicePdfDirect`, js/invoices.js ~L2343–2645)

| # | Rule | Where / how |
|---|---|---|
| R1 | **No "ITEM-1 / ITEM-2" model label.** Each item row shows one line of text: the description, normal weight. Use `it.desc`. Fall back to `it.model` only when `desc` is empty. | line-items `.map()` (~L2551): replace the two `<div>`s (bold model + grey desc) with one `<div>` |
| R2 | **No grey text anywhere in the invoice.** Change every `#64748b`, `#475569`, `#94a3b8` text color in this template to `#0f172a`. The `Project:` label becomes navy `#1e3a8a`. The meterai label and dashed border become `#0f172a`. Border lines (`#cbd5e1`) stay as they are. | whole template, including the DP-breakdown rows and the meterai box (~L2466) |
| R3 | **Remove the CONTRACT SUB TOTAL, milestone ("Custom Billing (…% of …)"), and "Previously billed" rows**, including the `[AMOUNT ADJUSTED]` badge. The non-DP footer is now just **DPP → VAT 11% → GRAND TOTAL**. | `tfoot`, non-`dpBreakdown` branch (~L2596–2622). `itemsSubTotal`, `milestonePercent`, `milestoneName` and `priorBilledDpp` become unused, so delete them. |
| R4 | Rename the VAT row label from `VAT:` to `VAT 11%:`. | same `tfoot` |
| R5 | **Remove the references panel completely**: the grey box with Contract Value, PO Ref, BAST Cert and DO Ref. | `<!-- REFERENCES PANEL ON PDF -->` block (~L2525–2536). Also delete the vars it alone used: `contractLabelOpt`, `poRefOpt`, `bastRefsStr`, `doRefsStr`. |
| R6 | **No printed company stamp or signature.** Keep "Issued by," / "PT. Hitecsolution Teknologi Prima", then a blank space about 57px high for a wet signature, then **Handoyo** in bold. Build this inline in this function. **Don't call `buildStampSignatureHtml`** here, and ignore `inv.show_stamp` for this export. | signature column (~L2632) |
| R7 | **No "Page X of Y" footer.** Remove the `drawPageFooters(pdf, pageCount)` call from this function only. | ~L2642 |
| R8 | Everything else stays as it is: letterhead, title, BILLED TO, INVOICE DETAILS, Project line, table header, the AMOUNT DUE / PAID / PARTIAL payment block, bank lines, meterai logic, and the filename. | |

### A2. Root cause of the wrong DPP (6.966.000 instead of 6.275.676)
This was a **data problem**, not a rendering bug. The LPSK project's `client_po` (PO `102/PPK-UDK/09/2026`, value 6.966.000) isn't flagged as tax-inclusive. So `resolveProjectContractValue()` (js/invoices.js ~L44) treated 6.966.000 as the DPP, and the "Custom Billing 100%" invoice ended up billing 111% of the item total.

**One-time data fix. Stop the server and back up `data/erp_master_data.json` first:**
1. On the LPSK project with `client_po.po_no === '102/PPK-UDK/09/2026'`, set `client_po.inclusive_tax = true`. `resolveProjectContractValue` then returns DPP `round(6966000/1.11) = 6275676` and total `6966000`.
2. On invoice `008/INV/HTP/0926`, set `dpp_amount = 6275676`, `tax_ppn = 690324`, `grand_total = 6966000`. If `values_snapshot` exists, also set `invoiced_dpp = 6275676`, `is_inclusive_tax = true`, `amount_adjusted = false`.
3. Check the invoice's faktur status. If a faktur was already issued on the old numbers, **stop and tell Ohan**, and don't edit anything else.

**Guard (small, in the invoice create/edit save path, ~L1000–1180):** if the invoice DPP is **greater than** the linked items' line-total sum, show a confirm dialog: `"Invoice DPP (x) is higher than the item total (y). Is the PO value tax-inclusive?"`. Only save if the user confirms. This is a warning only; it never changes numbers.

---

## Part B: New Receipt PDF

### B1. Entry point
- Add a **`Receipt`** button to the invoice toolbar (`updateInvoiceToolbar`, ~L1427), right after `PDF`. It's enabled when an invoice is selected and not cancelled.
- The click opens a small modal showing:
  - **Receipt No.**, read-only.
  - **Receipt Date**, a date input. Default: the date of the latest payment entry if the invoice is PAID (`getInvoicePaymentStatus(inv)`), otherwise today.
  - **Generate PDF** and **Cancel** buttons.
- New function `exportReceiptPdf(invNo)`, exported on `window` like the other exports.

### B2. Numbering: `NNN/R/HTP/MMYY`
- New pure function `generateNextReceiptNo(dateVal)`, modelled on `generateNextInvoiceNo` (~L83). It uses its **own** monthly sequence, scanning `erpState.invoices[].receipt_no` for `/^(\d{3})\/R\/HTP\/(\d{4})/`, where MMYY comes from the receipt date.
- The first export saves `inv.receipt_no` and `inv.receipt_date` on the invoice (`saveState()`), so a receipt keeps its number forever. Later exports reuse the saved number and date; the modal pre-fills the saved date, and changing it updates `receipt_date` but **never** the number.
- Expected result for the live data: invoice `008/INV/HTP/0926` gets **`001/R/HTP/0926`**.

### B3. Layout (copy the invoice template, then change these parts)
Same letterhead, fonts, table, DPP / VAT 11% / GRAND TOTAL footer, and all R1–R4 and R7 rules. Differences from the invoice:

| Area | Receipt content |
|---|---|
| Title | `RECEIPT` · `No: <receipt_no>` |
| Left party label | `RECEIVED FROM:` then client name (bold) and `Attn: <pic>`, same logic as the invoice |
| Right block | `RECEIPT DETAILS:` / `Date: <receipt_date, en-GB long>` / `Invoice Ref: <invoice_no>` / `Currency: **IDR**` (no Terms line) |
| Under Project | A plain line, **no box**: `**PO Ref:** <poRef>` (label navy). Only shown if a PO ref exists. No Contract Value. |
| Bottom left | `RECEIVED WITH THANKS: IDR <grand_total>` (label navy, amount dark) / *italic* `Terbilang: <words> rupiah` / `In full payment of Commercial Invoice No. **<invoice_no>**` (number navy) / `PAID TO:` (navy) / the 3 bank bullets: Bank, Account No., Account Name. **No** "include the invoice number" bullet. |
| Bottom right | `Received by,` (navy bold) / `PT. Hitecsolution Teknologi Prima` / about 95px of blank space with the plain text `Meterai Rp10.000` centred in it, **with no box or border** / **Handoyo** (bold). **No stamp or signature image.** |
| Footer | none (no Page X of Y) |
| Filename | `Receipt_<receipt_no with / → _>_<client>.pdf` |

### B4. `terbilangIDR(n)`: new pure helper (js/invoices.js, exported on window)
Indonesian number words, sentence case, no trailing "rupiah" (the template adds it). Rules: `seratus` / `seribu` for 100 and 1000, `sebelas`, `belas`, `puluh`, `ratus`, `ribu`, `juta`, `miliar`, `triliun`. Handles 0 through 999 triliun.
- `terbilangIDR(6966000)` → `Enam juta sembilan ratus enam puluh enam ribu`
- `terbilangIDR(1000)` → `Seribu`; `terbilangIDR(111)` → `Seratus sebelas`; `terbilangIDR(2015000)` → `Dua juta lima belas ribu`

---

## Part C: Tests (`tests/invoices/test_doc3.js`, same style as `tests/bast/test_bast2.js`)
1. `terbilangIDR`: the four cases above, plus 0 → `Nol`, 1 000 000 → `Satu juta`, 1 100 000 000 → `Satu miliar seratus juta`.
2. `generateNextReceiptNo`: empty state gives `001/R/HTP/0926` (date 2026-09-27); with an existing `001/R/HTP/0926` it gives `002/…`; a different month starts again at `001`; invoice numbers are never counted.
3. `resolveProjectContractValue` with `inclusive_tax:true` and value 6 966 000 gives dpp `6275676`, total `6966000`.
4. A text scan of `js/invoices.js`: the invoice and receipt templates contain no `#64748b`, `#475569` or `#94a3b8`, and neither `CONTRACT SUB TOTAL` nor `REFERENCES PANEL` appears.

## Part D: Finish
1. `npm test` (or run the new test file with node) → all PASS.
2. Visual check: start the server, export **invoice 008/INV/HTP/0926** and its **receipt**, and compare side by side with the two reference PDFs. The numbers must match exactly: DPP 6.275.676 · VAT 11% 690.324 · GRAND TOTAL 6.966.000 · receipt no. 001/R/HTP/0926.
3. Bump the `?v=` cache-buster (see AGENTS.md), commit as `feat(doc-3): invoice PDF clean-up + receipt PDF`, then run `bash HitecERP-dashboard/tools/backup_push.sh doc-3-done`.
4. Add a DOC-3 line to `docs/QUEUE.md`, followed by "Next: Cody QA DOC-3".
5. Report: `CHANGE: APPLIED / BUILD: PASS / TEST: PASS`, plus commit hash, plus a screenshot of both PDFs.

## Open questions for Ohan (don't block on these; Anti builds with the defaults)
- R5 also removes the **BAST Cert / DO Ref** references from the invoice. Default: removed, as approved. Say if you want them back as a plain line.
- R6 removes the printed stamp for **every** commercial invoice, not just this one. Default: yes.
