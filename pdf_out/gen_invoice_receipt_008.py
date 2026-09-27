"""One-off: corrected Commercial Invoice 008/INV/HTP/0926 + matching Receipt, printed via Chromium."""
import subprocess, pathlib

HERE = pathlib.Path('/tmp/claude-0/-home-user-hitecapp/ded4584d-3fca-59fd-9632-a267b8e85ee0/scratchpad')
OUT = pathlib.Path('/home/user/hitecapp/pdf_out')
CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

INK = '#0f172a'    # all body text: near-black, no grey
NAVY = '#1e3a8a'

items = [
    ('Reset &amp; Aktivasi Lisensi ZkBioCV Security (warrantty 1 years', 1, 3275676),
    ('Jasa Setting, adding , synchronize, set up Access, Visitor , Videos Surveillance', 1, 3000000),
]
dpp = sum(q * p for _, q, p in items)          # 6.275.676
vat = round(dpp * 0.11)                          # 690.324
total = dpp + vat                                # 6.966.000
assert (dpp, vat, total) == (6275676, 690324, 6966000)

fmt = lambda n: f'{n:,}'.replace(',', '.')
PO_REF = '102/PPK-UDK/09/2026'
# Invoice: highlighted references box. Receipt: plain PO Ref line, no box, no contract value.
BOX = f'''  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:7px 10px; margin-bottom:14px; font-size:7.5pt; line-height:1.4; display:flex; justify-content:space-between;">
    <div><strong style="color:{NAVY};">Contract Value:</strong> Client PO {PO_REF}: {fmt(total)} (incl. VAT 11%)</div>
    <div><strong style="color:{NAVY};">PO Ref:</strong> {PO_REF}</div>
  </div>'''
PO_LINE = f'''  <div style="margin:-6px 0 14px 0; font-size:9.5pt;">
    <span style="color:{NAVY}; font-weight:bold;">PO Ref:</span> {PO_REF}
  </div>'''
INV_NO = '008/INV/HTP/0926'
RCP_NO = '001/R/HTP/0926'


def page(title, doc_no, details_label, details_rows, bottom_left, signer_label, show_stamp):
    refs = PO_LINE if title == 'RECEIPT' else BOX
    rows = ''.join(f'''
      <tr style="border-bottom:1px solid #cbd5e1;">
        <td style="padding:10px 8px; text-align:center;">{i}</td>
        <td style="padding:10px 8px; line-height:1.45;">{d}</td>
        <td style="padding:10px 8px; text-align:center;">{q}</td>
        <td class="amt" style="padding:10px 8px;">{fmt(p)}</td>
        <td class="amt" style="padding:10px 8px; font-weight:bold;">{fmt(q * p)}</td>
      </tr>''' for i, (d, q, p) in enumerate(items, 1))
    details = ''.join(f'<div style="margin-top:2px;">{r}</div>' for r in details_rows)
    # Invoice: company stamp + signature. Receipt: empty Rp10.000 meterai box to sign over by hand.
    stamp = ('<img src="hitec_stamp_signature.png" style="height:55px;">' if show_stamp else
             '<div><div style="width:113px; height:95px; '
             'display:flex; align-items:center; justify-content:center; font-size:7.5pt;">Meterai Rp10.000</div></div>')
    name = 'Handoyo'
    return f'''<!doctype html><html><head><meta charset="utf-8"><title>{title} {doc_no}</title>
<style>
  @page {{ size: A4; margin: 0; }}
  html, body {{ margin:0; padding:0; background:#fff; }}
  body {{ width:794px; height:1122px; position:relative; color:{INK};
         font-family:'Liberation Sans', Arial, Helvetica, sans-serif;
         -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
  .amt {{ text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }}
  th {{ padding:5px 8px; font-size:8.5pt; letter-spacing:0.6px; text-transform:uppercase; }}
  .lbl {{ color:{NAVY}; font-weight:bold; font-size:8pt; letter-spacing:0.6px; text-transform:uppercase; margin-bottom:2px; }}
</style></head><body>
<div style="position:relative; width:794px; height:100px;">
  <img src="logo.png" style="position:absolute; left:20px; top:7px; width:408px;">
  <img src="mesh.png" style="position:absolute; left:492px; top:0; width:300px;">
</div>
<div style="padding:14px 38px 36px 38px;">
  <div style="text-align:center; margin-bottom:16px;">
    <h2 style="margin:0; font-size:17pt; color:{NAVY}; letter-spacing:1.5px;">{title}</h2>
    <div style="font-size:10pt; margin-top:3px; letter-spacing:0.5px;">No: {doc_no}</div>
  </div>

  <div style="display:flex; justify-content:space-between; font-size:9pt; margin-bottom:14px; line-height:1.45;">
    <div>
      <div class="lbl">{'RECEIVED FROM:' if title == 'RECEIPT' else 'BILLED TO:'}</div>
      <div style="font-size:10.5pt; font-weight:bold;">Lembaga Perlindungan Saksi dan Korban</div>
      <div style="margin-top:2px;">Attn: Mrs. Intan Cahyani</div>
    </div>
    <div style="text-align:right;">
      <div class="lbl">{details_label}</div>
      {details}
    </div>
  </div>

  <div style="margin-bottom:14px; font-size:9.5pt;">
    <span style="color:{NAVY}; font-weight:bold;">Project:</span> <span style="font-weight:bold;">Setting ZKBio CVSecurity</span>
  </div>

{refs}

  <table style="width:100%; border-collapse:collapse; font-size:8.5pt; margin-bottom:16px;">
    <thead><tr style="background:{NAVY}; color:#fff;">
      <th style="text-align:center; width:28px;">NO</th>
      <th style="text-align:left;">PART MODEL / DETAILS</th>
      <th style="text-align:center; width:45px;">QTY</th>
      <th class="amt" style="width:100px;">UNIT PRICE</th>
      <th class="amt" style="width:110px;">TOTAL</th>
    </tr></thead>
    <tbody>{rows}</tbody>
    <tfoot>
      <tr><td colspan="4" style="padding:6px 8px; text-align:right;">DPP:</td><td class="amt" style="padding:6px 8px;">{fmt(dpp)}</td></tr>
      <tr><td colspan="4" style="padding:5px 8px; text-align:right;">VAT 11%:</td><td class="amt" style="padding:5px 8px;">{fmt(vat)}</td></tr>
      <tr style="font-size:9.5pt; border-top:1px solid #cbd5e1; border-bottom:1px solid #cbd5e1;">
        <td colspan="4" style="padding:7px 8px; text-align:right; color:{NAVY}; font-weight:bold; letter-spacing:0.5px;">GRAND TOTAL:</td>
        <td class="amt" style="padding:7px 8px; color:{NAVY}; font-size:10pt; font-weight:bold;">{fmt(total)}</td>
      </tr>
    </tfoot>
  </table>

  <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:20px;">
    <div style="font-size:9pt; max-width:440px; line-height:1.55;">{bottom_left}</div>
    <div style="text-align:center; width:220px;">
      <div style="color:{NAVY}; font-size:9pt; font-weight:bold;">{signer_label}</div>
      <div style="margin-top:2px; font-size:8.5pt;">PT. Hitecsolution Teknologi Prima</div>
      <div style="margin-top:20px;">
        <div style="min-height:57px; display:flex; align-items:center; justify-content:center; margin:4px 0;">{stamp}</div>
        <div style="font-weight:bold; font-size:9pt;">{name}</div>
      </div>
    </div>
  </div>
</div>
<div style="position:absolute; bottom:26px; width:100%; text-align:center; font-size:8pt;">Page 1 of 1</div>
</body></html>'''


bank = f'''
  <div>• Bank: Bank Mandiri</div>
  <div>• Account No.: <span style="color:{NAVY}; font-weight:bold; font-family:'Liberation Mono', monospace;">1230013581477</span></div>
  <div>• Account Name: PT. Hitecsolution Teknologi Prima</div>'''

invoice_left = f'''
  <div style="color:{NAVY}; font-weight:bold; margin-bottom:3px; letter-spacing:0.4px;">AMOUNT DUE: <span style="color:{INK};">{fmt(total)}</span></div>
  <div>Due date: 05 October 2026</div>
  <div style="color:{NAVY}; font-weight:bold; margin-top:6px; margin-bottom:3px; letter-spacing:0.4px;">PAYMENT INSTRUCTIONS:</div>
  {bank}
  <div>• Please include the invoice number <b style="color:{NAVY};">{INV_NO}</b> in the transfer remarks</div>'''

receipt_left = f'''
  <div style="color:{NAVY}; font-weight:bold; margin-bottom:3px; letter-spacing:0.4px;">RECEIVED WITH THANKS: <span style="color:{INK};">IDR {fmt(total)}</span></div>
  <div><i>Terbilang: Enam juta sembilan ratus enam puluh enam ribu rupiah</i></div>
  <div style="margin-top:4px;">In full payment of Commercial Invoice No. <b style="color:{NAVY};">{INV_NO}</b></div>
  <div style="color:{NAVY}; font-weight:bold; margin-top:6px; margin-bottom:3px; letter-spacing:0.4px;">PAID TO:</div>
  {bank}'''

docs = {
    'Invoice_008-INV-HTP-0926_LPSK': page(
        'COMMERCIAL INVOICE', INV_NO, 'INVOICE DETAILS:',
        ['Date: 28 September 2026', 'Terms: Custom Billing (100%)', 'Currency: <b>IDR</b>'],
        invoice_left, 'Issued by,', True),
    'Receipt_001-R-HTP-0926_LPSK': page(
        'RECEIPT', RCP_NO, 'RECEIPT DETAILS:',
        ['Date: 28 September 2026', f'Invoice Ref: {INV_NO}', 'Currency: <b>IDR</b>'],
        receipt_left, 'Received by,', False),
}
for name, html in docs.items():
    src = HERE / f'{name}.html'
    src.write_text(html)
    subprocess.run([CHROME, '--headless', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer',
                    f'--print-to-pdf={OUT / (name + ".pdf")}', src.as_uri()], check=True, capture_output=True)
    print('wrote', OUT / (name + '.pdf'))
