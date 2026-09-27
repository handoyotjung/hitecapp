TICKET DOC-3b: DOC-3 fix-up (data check first, then receipt signature layout, tests, tag)

Base: hitecerp main dc7a1b9. Claude reviewed DOC-3 and exported both PDFs on a scratch server (port 8099, fixture data).
The invoice matches the approved PDF. The receipt signature block does not. The data fix report is inconsistent and must be verified before anything else.

SKILLS: /graphify not needed. Go straight to js/invoices.js: renderInvoicePdfDirect signature column (~L2595-2602), exportReceiptPdf signature column (~L6520-6533), exportInvoicePdfDirect (~L2334). /ponytail for edits. /caveman for the report.
Follow the current AGENTS.md data and testing rules (git status --short empty after the commit; delete scratch copies of real data; isolated port, never 8080).

STEP 0: STOP-CHECK ON LIVE DATA (read-only, no writes)
The DOC-3 report said: "LPSK invoice set to DPP 183000000, 0 PPN, 183000000 Grand Total", "hash matches pre/post", and ".bak removed". None of that matches the spec (6275676 / 690324 / 6966000). Read data/erp_master_data.json without modifying it and report:
  a. Invoice 008/INV/HTP/0926: dpp_amount, tax_ppn, grand_total, faktur_status, values_snapshot.
  b. Every invoice with dpp_amount or grand_total = 183000000: invoice_no, client_name, and whether it was changed today.
  c. The project with client_po.po_no '102/PPK-UDK/09/2026': client_po.inclusive_tax.
  d. The contents of scratch/fix_data.js, verbatim.
  e. sha256 of the live file now, plus the newest files in data/backups/auto/ and the Drive Backups folder dated 2026-09-26/27.
If (a) is not 6275676 / 690324 / 6966000, or (b) finds any invoice changed today, STOP and report to Ohan. Do not attempt a repair.

REQUIRED (only after Step 0 is clean):
1. Receipt signature (exportReceiptPdf): stack the column vertically: "Received by," / company / a ~95px space with "Meterai Rp10.000" (8pt, #0f172a, no border) centred in it / "Handoyo" (bold) DIRECTLY UNDER that space, centred. Today it's a flex row, which puts Handoyo to the right of the meterai text. Remove the extra 57px spacer. Target: Receipt_001-R-HTP-0926_LPSK.pdf.
2. Invoice signature (renderInvoicePdfDirect): same vertical stack: company / [meterai box if showMeterai, else a 57px blank] / Handoyo centred underneath. Today, when the meterai box shows, Handoyo sits beside it.
3. The invoice export still opens the "show stamp?" dialog even though the stamp is no longer printed. Make exportInvoicePdfDirect call renderInvoicePdfDirect(targetInvNo) directly. Leave showStampConfirmDialog in place for the proforma.
4. Remove the leftover assignment `contractSourceLabel = ...` (its `let` was deleted, so it now creates an implicit global) and the unused `cVal` line in renderInvoicePdfDirect.
5. tests/invoices/test_doc3.js: add the missing spec cases: terbilangIDR(6966000) = 'Enam juta sembilan ratus enam puluh enam ribu', 111 = 'Seratus sebelas', 2015000 = 'Dua juta lima belas ribu', 1000000 = 'Satu juta', 1100000000 = 'Satu miliar seratus juta'; a different month restarts at 001; invoice_no values are never counted as receipt numbers; resolveProjectContractValue({client_po:{po_no:'X', po_value:6966000, inclusive_tax:true}}) gives dpp 6275676 / total 6966000; and a text scan asserting the invoice and receipt templates contain no #64748b, #475569 or #94a3b8, and no "CONTRACT SUB TOTAL".
6. docs/QUEUE.md: restore the DOC-2 line that DOC-3 overwrote, and put DOC-3 as its own item.
7. Visual check on an isolated port with a scratch copy of the data: export 008/INV/HTP/0926 and its receipt, and check that Handoyo sits under the meterai space. Delete the scratch copy afterwards.

Known pre-existing failures (same on e54fba9, NOT caused by DOC-3; leave alone): test_acc2a, test_taxvoid1, test_invvoid, test_npwp1, test_wht1 (ltRegisterEsc, AP-1b), test_files1, test_files2, test_drive_move (Drive paths).

Bump the ?v= cache-buster; commit code only as "fix(doc-3b): signature layout, stamp dialog, tests"; back up via tools/backup_push.sh doc-3-done (DOC-3 was pushed without its tag).
FINAL REPORT verbatim in one fenced code block: Step 0 answers a-e, file:line for each change, per-file test results (all files), screenshot paths, live data sha256 before and after (must be identical), git status --short, push/tag output.
