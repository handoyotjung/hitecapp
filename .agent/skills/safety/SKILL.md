---
name: safety
description: Enforces the !safety client data protection invariant for PT Safety Indonesia Utama / PT Tirta Investama Citeureup Plant data. Runs pre-flight SHA256 baseline snapshots, filters transient test targets, runs post-flight cryptographic hash verification, and locks deployments if client data integrity is altered.
---

# `!safety` / `/safety` — Client Data Protection & Integrity Protocol

## Overview
This skill guarantees 100% data protection for all real client projects and assessor data (specifically **PT. Tirta Investama Citeureup Plant** led by Pak Bara) during investigation, debugging, and live feature development in **HitecApp-Safety**.

## Core Operational Invariants

### 1. Pre-Flight Baseline Check (`--pre`)
Before executing any live browser tests, client writes, or investigative operations:
```bash
python scratch/audit_pak_bara_data.py --pre
```
- Captures SHA256 cryptographic snapshot hash of all client projects, photos, captions, grades, and whitelist users into `scratch/.safety_baseline.json`.
- Confirms baseline is recorded before any transient operations commence.

### 2. Strict Target Write Filter & Explicit Test Project Isolation
- **Zero Real Writes**: NEVER click "Regenerate", "Save Report", "Delete", or edit real client projects (`PT. Tirta Investama Citeureup Plant` / `proj_3ikf96wqp`, `proj_yqki0jjz0`, `proj_3rjoxxj4f`, `proj_7lo0ownln`, `proj_v563g5m9s`, `proj_tgsqmpwbg`).
- **Explicit Project Creation Before Typing**: Automated browser and UI test scripts MUST explicitly click "New Project" / create a blank temporary project with a unique name (`AuditScenario_*` or `LiveTest_*`) and confirm it is selected and active BEFORE typing into company, city, caption, or report fields. Never rely on or type into whatever project the dashboard auto-selects upon load, preventing autosave bindings from mutating existing client project metadata.
- **Allowed Test Targets**: All automated tests, mock uploads, and browser operations MUST strictly target transient dummy projects matching:
  - `AuditScenario_*`
  - `LiveTest_*`
  - `Dummy_*`
- **Transient Cleanup**: Any test documents created during testing MUST be deleted immediately upon test completion.

### 3. Post-Flight Integrity Verification (`--post`)
After all test runs or code modifications are complete:
```bash
python scratch/audit_pak_bara_data.py --post
```
- Computes SHA256 snapshot hash of production Firestore client collections.
- Asserts a **100% match** against the pre-flight baseline hash.
- Throws error code `1` and halts all pipelines if any modification or data loss is detected on real client documents.

### 4. Deploy Lock Protocol
- **Zero Deploy on Mismatch**: If `audit_pak_bara_data.py --post` fails or reports a mismatch, `firebase deploy` commands are strictly **LOCKED & FORBIDDEN**.
- Deployments (`firebase deploy --only hosting,functions`) are only permitted when:
  1. Pre- and post-audit hashes match 100%.
  2. The Hard Stop Protocol is observed (turn ended for Ohan's review and explicit approval).

### 5. Inspection Mode
To inspect current Firestore projects and photos in human-readable format without updating baseline:
```bash
python scratch/audit_pak_bara_data.py
```
