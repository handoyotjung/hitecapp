import base64, os

with open('C:/Users/Administrator/Documents/AntiGravity/docs/flow-main.png','rb') as f:
    main_b64 = base64.b64encode(f.read()).decode()
with open('C:/Users/Administrator/Documents/AntiGravity/docs/flow-states.png','rb') as f:
    states_b64 = base64.b64encode(f.read()).decode()

HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HitecApp Safety — User Workflows</title>
<style>
  :root { --bg:#0f172a;--surface:#1e293b;--border:#334155;--text:#e2e8f0;--muted:#94a3b8;--green:#34d399;--yellow:#fbbf24;--red:#f87171;--blue:#60a5fa; }
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:15px;line-height:1.7;padding:2rem}
  .container{max-width:960px;margin:0 auto}
  h1{font-size:2rem;font-weight:800;color:var(--green);margin-bottom:.25rem}
  .subtitle{color:var(--muted);margin-bottom:2.5rem;font-size:.95rem}
  h2{font-size:1.35rem;font-weight:700;color:var(--green);margin:2.5rem 0 1rem;padding-bottom:.4rem;border-bottom:1px solid var(--border)}
  h3{font-size:1.05rem;font-weight:700;color:var(--blue);margin:1.5rem 0 .5rem}
  h4{font-size:.95rem;font-weight:600;color:var(--yellow);margin:1.2rem 0 .4rem}
  p{margin-bottom:.75rem}
  ul,ol{padding-left:1.5rem;margin-bottom:.75rem}
  li{margin-bottom:.3rem}
  .g{color:var(--green);font-weight:600} .y{color:var(--yellow);font-weight:600} .r{color:var(--red);font-weight:600} .b{color:var(--blue);font-weight:600}
  code{background:#1e293b;border:1px solid var(--border);border-radius:4px;padding:.1em .45em;font-family:Consolas,monospace;font-size:.85em;color:#fbbf24}
  table{width:100%;border-collapse:collapse;margin:1rem 0 1.5rem;font-size:.9rem}
  th{background:#1e293b;color:var(--green);font-weight:700;text-align:left;padding:.6rem .9rem;border:1px solid var(--border)}
  td{padding:.55rem .9rem;border:1px solid var(--border);vertical-align:top}
  tr:nth-child(even) td{background:#1e293b55}
  .diagram{background:#1e293b;border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin:1.5rem 0;text-align:center}
  .diagram img{max-width:100%;border-radius:8px}
  .diagram-label{font-size:.8rem;color:var(--muted);margin-top:.75rem}
  .step{background:#1e293b;border-left:3px solid var(--green);border-radius:0 8px 8px 0;padding:1rem 1.25rem;margin:1rem 0}
  .step-num{font-size:.75rem;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.25rem}
  .ptag{display:inline-block;font-size:.7rem;font-weight:700;padding:.15em .6em;border-radius:999px;margin-left:.5rem;vertical-align:middle}
  .mob{background:#3730a3;color:#a5b4fc} .des{background:#164e63;color:#67e8f9}
  .note{background:#1e3a5f55;border:1px solid #3b82f655;border-radius:8px;padding:.75rem 1rem;margin:.75rem 0;font-size:.88rem;color:#93c5fd}
  .warn{background:#44270055;border:1px solid #f59e0b55;border-radius:8px;padding:.75rem 1rem;margin:.75rem 0;font-size:.88rem;color:#fcd34d}
  .toc{background:#1e293b;border:1px solid var(--border);border-radius:10px;padding:1.25rem 1.5rem;margin-bottom:2rem}
  .toc h3{margin-top:0;font-size:.9rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
  .toc ol{margin-bottom:0}
  .toc a{color:var(--blue);text-decoration:none}
  .toc a:hover{text-decoration:underline}
  footer{margin-top:3rem;padding-top:1rem;border-top:1px solid var(--border);color:var(--muted);font-size:.82rem;text-align:center}
</style>
</head>
<body>
<div class="container">

<h1>HitecApp Safety</h1>
<p class="subtitle">User Workflow Documentation &mdash; Mobile &amp; Desktop &mdash; 2026-08-04</p>

<div class="toc">
  <h3>Contents</h3>
  <ol>
    <li><a href="#comparison">Platform Comparison</a></li>
    <li><a href="#common">Common Flow</a></li>
    <li><a href="#mobile">Mobile Workflow</a></li>
    <li><a href="#desktop">Desktop Workflow</a></li>
    <li><a href="#states">State Transitions</a></li>
    <li><a href="#modes">Edit vs View Mode</a></li>
    <li><a href="#errors">Error States &amp; Recovery</a></li>
    <li><a href="#roles">User Roles</a></li>
  </ol>
</div>

<h2 id="comparison">Platform Comparison</h2>
<table>
  <tr><th>Feature</th><th><span class="mob ptag">MOBILE</span></th><th><span class="des ptag">DESKTOP</span></th></tr>
  <tr><td>Layout</td><td>Single-column, stacked</td><td>Two-column, side-by-side</td></tr>
  <tr><td>Photo input</td><td>Camera capture + folder select</td><td>Folder select + drag &amp; drop</td></tr>
  <tr><td>Caption input</td><td>Tap to expand, speech-to-text mic</td><td>Click to expand, keyboard</td></tr>
  <tr><td>Drag reorder</td><td>Touch drag</td><td>Mouse drag</td></tr>
  <tr><td>Export</td><td>OS share sheet (PDF/PPT/DOC)</td><td>Direct download</td></tr>
  <tr><td>Admin panel</td><td><span class="r">Not available</span></td><td><span class="g">Available at /admin.html</span></td></tr>
  <tr><td>Folder picker</td><td>Android Chrome only</td><td>All modern browsers</td></tr>
</table>

<h2 id="common">Common Flow (Both Platforms)</h2>
<div class="diagram">
  <img src="data:image/png;base64,MAIN_B64" alt="Main User Flow Diagram">
  <div class="diagram-label">Figure 1 &mdash; Complete user journey from login to export</div>
</div>

<h2 id="mobile">Mobile Workflow <span class="mob ptag">MOBILE</span></h2>

<div class="step"><div class="step-num">Step 1</div>
<h3 style="margin:0 0 .5rem">Login</h3>
<ul>
  <li>App opens to login screen</li>
  <li>Select <code>Mobile</code> radio button (pre-selected by default)</li>
  <li>Enter email and password &rarr; tap <strong>Sign In</strong></li>
  <li>On success: Dashboard loads in single-column mobile layout</li>
</ul></div>

<div class="step"><div class="step-num">Step 2</div>
<h3 style="margin:0 0 .5rem">Project Setup</h3>
<ul>
  <li><strong>No project:</strong> Enter Company name, City name, Project name &rarr; tap <strong>Create</strong></li>
  <li><strong>Existing project:</strong> Tap dropdown &rarr; select project &rarr; View Mode resets automatically</li>
  <li>Company / City fields populate from saved project data</li>
</ul></div>

<div class="step"><div class="step-num">Step 3</div>
<h3 style="margin:0 0 .5rem">Edit Mode (default)</h3>
<p>All inputs unlocked. Save button shows <span class="g">Save</span>. AutoSave runs silently every 700ms on change.</p>
<h4>3a &mdash; Add Photos via Camera</h4>
<ul>
  <li>Tap <strong>Use Camera</strong> &rarr; browser requests camera permission (grant once)</li>
  <li>Live rear camera feed opens &rarr; tap screen to capture</li>
  <li>Photo queues immediately in the photo list</li>
</ul>
<h4>3b &mdash; Add Photos via Folder</h4>
<ul>
  <li>Tap <strong>Select Folder</strong> &rarr; OS folder picker opens</li>
  <li>All supported images load at once: JPEG / JPG / PNG / GIF / WEBP</li>
  <li>Files &gt; 190KB are auto-compressed before queuing</li>
</ul>
<div class="warn">&#9888; iOS Safari does not support folder picking &mdash; degrades to single file (OS limitation)</div>
<h4>3c &mdash; Add Captions</h4>
<ul>
  <li><span class="y">Yellow</span> text = no caption &mdash; tap to open editor</li>
  <li><span class="g">Green</span> text = caption saved &#10003;</li>
  <li>Caption editor expands to 5 rows</li>
  <li>Hold <strong>&#127908; Mic</strong> &rarr; speak &rarr; release &rarr; transcript fills field for review</li>
  <li>Tap <strong>&#10003;</strong> to save, <strong>&#10005;</strong> to clear</li>
</ul>
<h4>3d &mdash; Assign Grade</h4>
<ul>
  <li>Tap a photo row to open right-panel editor</li>
  <li>Select grade (F1&ndash;F5 or custom) &rarr; auto-saved via AutoSave</li>
</ul></div>

<div class="step"><div class="step-num">Step 4</div>
<h3 style="margin:0 0 .5rem">Save &rarr; View Mode</h3>
<ul>
  <li>Tap <strong>Save</strong> in the bottom PublishBar</li>
  <li>All interactive elements lock: Company/City inputs, project dropdown, checkboxes, drag handles, remove button</li>
  <li>Save button label changes to <span class="g">Edit</span></li>
  <li>PDF / PPT / DOC buttons become <span class="g">enabled</span></li>
</ul></div>

<div class="step"><div class="step-num">Step 5</div>
<h3 style="margin:0 0 .5rem">Export Report</h3>
<ul>
  <li>Tap <strong>PDF</strong>, <strong>PPT</strong>, or <strong>DOC</strong></li>
  <li>Filename: <code>{Company} {City} {Year}.ext</code></li>
  <li>Example: <code>PT Safety Indonesia Utama Jakarta 2026.pdf</code></li>
  <li>Android: OS share sheet &rarr; save to phone / Google Drive / WhatsApp</li>
</ul></div>

<div class="step"><div class="step-num">Step 6</div>
<h3 style="margin:0 0 .5rem">Return to Edit Mode</h3>
<ul>
  <li>Tap <span class="g">Edit</span> button &rarr; all inputs unlock</li>
  <li>Add more photos or update captions &rarr; tap Save again to re-lock</li>
</ul></div>

<div class="step"><div class="step-num">Step 7 (optional)</div>
<h3 style="margin:0 0 .5rem">Feedback &amp; Help</h3>
<ul>
  <li>Tap <strong>Help</strong> in header &rarr; dropdown appears</li>
  <li><strong>Send Feedback</strong> &rarr; AI chat modal. Type or use &#127908; Mic. Tap <strong>Done &amp; Submit</strong>. Saves to Firestore.</li>
  <li><strong>User Guide</strong> &rarr; scrollable in-app guide</li>
</ul></div>

<h2 id="desktop">Desktop Workflow <span class="des ptag">DESKTOP</span></h2>

<div class="step"><div class="step-num">Step 1</div>
<h3 style="margin:0 0 .5rem">Login</h3>
<ul>
  <li>Select <code>Desktop</code> radio button &rarr; enter credentials &rarr; click <strong>Sign In</strong></li>
  <li>Dashboard loads in two-column layout: left = photo queue + PublishBar, right = photo editor</li>
</ul></div>

<div class="step"><div class="step-num">Step 2</div>
<h3 style="margin:0 0 .5rem">Project Setup</h3>
<ul>
  <li>Same fields as Mobile &mdash; Company, City, Project Name at top of left column</li>
  <li>Click <strong>Create</strong> or select from dropdown. View Mode resets on project switch.</li>
</ul></div>

<div class="step"><div class="step-num">Step 3</div>
<h3 style="margin:0 0 .5rem">Edit Mode</h3>
<h4>3a &mdash; Add Photos via Folder</h4>
<ul>
  <li>Click <strong>Select Folder</strong> &rarr; folder picker opens &rarr; all supported images load</li>
  <li>Drag and drop a folder directly onto the upload zone also works</li>
</ul>
<h4>3b &mdash; Add Captions</h4>
<ul>
  <li>Click <span class="y">yellow</span> &ldquo;No caption&rdquo; text &rarr; textarea expands inline</li>
  <li>Type using keyboard &rarr; click <strong>&#10003;</strong> to save</li>
  <li>Speech-to-text mic available on Chrome &amp; Edge</li>
</ul>
<h4>3c &mdash; Edit Photo Details (right panel)</h4>
<ul>
  <li>Click any photo thumbnail &rarr; opens in right-panel editor</li>
  <li>Fields: caption, grade, observation, recommendation, comments</li>
  <li>All fields auto-save via AutoSave (700ms debounce)</li>
  <li>Annotate directly on photo using the annotation canvas</li>
</ul>
<h4>3d &mdash; Reorder Photos</h4>
<ul>
  <li>Grab the <strong>&#8942; grip handle</strong> on the right side of any photo row</li>
  <li>Drag up or down &rarr; order saved immediately</li>
</ul></div>

<div class="step"><div class="step-num">Step 4</div>
<h3 style="margin:0 0 .5rem">Save &rarr; View Mode</h3>
<ul>
  <li>Click <strong>Save</strong> in the PublishBar (bottom of left column)</li>
  <li>Same lock behaviour as Mobile. Right-column Save Report button also disabled.</li>
</ul></div>

<div class="step"><div class="step-num">Step 5</div>
<h3 style="margin:0 0 .5rem">Export Report</h3>
<ul>
  <li>Click <strong>PDF</strong>, <strong>PPT</strong>, or <strong>DOC</strong> &rarr; file downloads to browser download folder</li>
  <li>Filename: <code>{Company} {City} {Year}.ext</code></li>
</ul></div>

<div class="step"><div class="step-num">Step 6 (Admin only)</div>
<h3 style="margin:0 0 .5rem">Admin Panel</h3>
<ul>
  <li>Navigate to <code>/admin.html</code></li>
  <li>Available to <code>admin</code> and <code>super_admin</code> roles only</li>
  <li>Features: user management, whitelist, session audit, feedback review</li>
  <li>Admin manages role=user only. Super_admin manages admin + user.</li>
</ul></div>

<h2 id="states">State Transitions</h2>
<div class="diagram">
  <img src="data:image/png;base64,STATES_B64" alt="State Transition Diagram">
  <div class="diagram-label">Figure 2 &mdash; Edit Mode / View Mode / Export state machine</div>
</div>

<h2 id="modes">Edit Mode vs View Mode</h2>
<table>
  <tr><th>State</th><th>Inputs</th><th>Save Button</th><th>PDF/PPT/DOC</th><th>Drag</th><th>AutoSave</th></tr>
  <tr><td><span class="g">Edit Mode</span></td><td>Unlocked</td><td><span class="g">"Save"</span></td><td><span class="r">Disabled</span></td><td>Enabled</td><td>Running silently</td></tr>
  <tr><td><span class="y">View Mode</span></td><td>Locked</td><td><span class="g">"Edit"</span></td><td><span class="g">Enabled</span></td><td>Disabled</td><td>Not triggered</td></tr>
</table>

<h2 id="errors">Error States &amp; Recovery</h2>
<table>
  <tr><th>Error</th><th>What user sees</th><th>Recovery</th></tr>
  <tr><td>Login failed</td><td>Red error message below form</td><td>Re-enter credentials</td></tr>
  <tr><td>No project selected</td><td>Save / PDF / PPT / DOC buttons locked</td><td>Create or select a project</td></tr>
  <tr><td>Export failed</td><td>Red error banner below PublishBar</td><td>Check connection &rarr; retry</td></tr>
  <tr><td>Photo upload stuck</td><td>Item at 0% in queue</td><td>Watchdog auto-removes after 30s</td></tr>
  <tr><td>Offline</td><td>Connectivity modal with retry button</td><td>Reconnect &rarr; tap Retry in modal</td></tr>
  <tr><td>Camera denied</td><td>Camera button unresponsive</td><td>Grant permission in browser settings</td></tr>
  <tr><td>iOS folder pick</td><td>Single file picker instead of folder</td><td>Select files individually (OS limitation)</td></tr>
</table>

<h2 id="roles">User Roles</h2>
<table>
  <tr><th>Role</th><th>Dashboard</th><th>Admin Panel</th><th>Manage Users</th><th>Manage Admins</th></tr>
  <tr><td><code>user</code></td><td><span class="g">&#10003;</span></td><td><span class="r">&#10007;</span></td><td><span class="r">&#10007;</span></td><td><span class="r">&#10007;</span></td></tr>
  <tr><td><code>admin</code></td><td><span class="g">&#10003;</span></td><td><span class="g">&#10003;</span></td><td><span class="g">&#10003; (role=user only)</span></td><td><span class="r">&#10007;</span></td></tr>
  <tr><td><code>super_admin</code></td><td><span class="g">&#10003;</span></td><td><span class="g">&#10003;</span></td><td><span class="g">&#10003;</span></td><td><span class="g">&#10003;</span></td></tr>
</table>

<footer>HitecApp Safety &mdash; User Workflow Documentation &mdash; Generated 2026-08-04</footer>
</div>
</body>
</html>"""

HTML = HTML.replace('MAIN_B64', main_b64).replace('STATES_B64', states_b64)

with open('docs/user-workflows.html', 'w', encoding='utf-8') as f:
    f.write(HTML)
print('Done — saved to docs/user-workflows.html')
