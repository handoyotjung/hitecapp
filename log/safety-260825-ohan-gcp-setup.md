# Executive Architecture & Billing Summary: Project `ohanid` & Vertex AI Setup

**Date**: August 25, 2026  
**Author**: Anti (Orchestrator) & Spark (Cloud Architect)  
**Stakeholder**: Ohan (Lead)  

---

## 1. Project Separation & Architecture Mapping

To eliminate billing confusion and avoid quota/credential collisions, the fleet infrastructure is partitioned into two distinct operational axes:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE TOPOLOGY                         │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. APP INFRASTRUCTURE RUNTIME │ 2. AI DEVELOPER / BILLING ENGINES     │
├────────────────────────────────┼───────────────────────────────────────┤
│ • hitecapp-safety (Demo/Dev)   │ • ohanid (Private Developer Sandbox)  │
│   - Firestore DB, Auth, Rules  │   - $300 (Rp 5.3M) Free Trial Credits │
│   - Firebase Hosting           │   - Vertex AI Model Garden            │
│ • hitecmedia-app (Production)  │ • claude-zen proxy (Bedrock / Fleet)  │
│   - Live Client Assessments    │   - Autonomous Cody Execution         │
└────────────────────────────────┴───────────────────────────────────────┘
```

### Clean Team & Billing Matrix

| Agent / Surface | Execution Environment | AI Provider / Model | Bound GCP Project / Role | Cost Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Anti (AntiGravity IDE)** | AntiGravity IDE | Gemini 3.7 Flash | `hitecapp-safety` (Architecture / Orchestration) | Google Free / Standard Tier |
| **Cody (Fleet CLI)** | Terminal / CLI Bridge | claude-zen proxy / Nemotron | `hitecapp-safety` (Execution / Tests / Build) | $0 (Zero fleet cost) |
| **Ohan Private VS Code** | VS Code Editor | Vertex AI | `ohanid` (Private sandbox & experiments) | Deducted from $300 Credits / Direct Card |

---

## 2. Configuration Record for `ohanid`

Cody executed and persisted the following environment configuration into the Windows User Scope:

```powershell
# PowerShell User Scope Variables (Applied & Active)
[System.Environment]::SetEnvironmentVariable('CLAUDE_CODE_USE_VERTEX', '1', 'User')
[System.Environment]::SetEnvironmentVariable('ANTHROPIC_VERTEX_PROJECT_ID', 'ohanid', 'User')
[System.Environment]::SetEnvironmentVariable('CLOUD_ML_REGION', 'us-east5', 'User')
[System.Environment]::SetEnvironmentVariable('ANTHROPIC_MODEL', 'claude-sonnet-5', 'User')
[System.Environment]::SetEnvironmentVariable('CLAUDE_MODEL', 'claude-sonnet-5', 'User')
```

- **GCP Project**: `ohanid` ("Ohan Private Projects")
- **Active User Account**: `handoyo.tjung@gmail.com`
- **Vertex AI API**: `aiplatform.googleapis.com` (Enabled)
- **Application Default Credentials (ADC)**: Refreshed and linked to `ohanid`

---

## 3. Financial & Promotional Credit Analysis

### Credit Status
- **Credit Balance**: **Rp 5,309,400.81** (~$300+ USD)
- **Credit Type**: `FreeTrial:Cr...` (One-time promotional credit)
- **Expiration Status**: Active (99% remaining)

### Critical Billing Distinction: 1st-Party vs 3rd-Party Marketplace

> [!WARNING]
> **Marketplace Restriction Notice:**  
> Google Cloud Free Trial promotional terms explicitly state that promotional credits **do not cover third-party Google Cloud Marketplace vendor subscriptions or licensing fees** (including Anthropic partner models in Model Garden).

| Service Type | Service Examples | Uses Rp 5.3M Credit? | Direct Card Charge? |
| :--- | :--- | :---: | :---: |
| **Google 1st-Party AI** | Gemini 2.5 Pro/Flash, Gemini 3.7 Pro/Flash, Imagen 3, Embeddings | ✅ **YES** (100% covered) | ❌ No ($0 out of pocket) |
| **Google Cloud Infra** | Firebase, Firestore, Cloud Functions, Cloud Run, Cloud Storage | ✅ **YES** (100% covered) | ❌ No ($0 out of pocket) |
| **Anthropic Claude** | Claude Sonnet 5, Claude Opus 5 (Marketplace Agreement) | ❌ **NO** (Excluded from Free Trial) | ⚠️ **YES** (Pay-as-you-go per token) |

---

## 4. Implemented Production Setup: Gemini 3.7 Flash on VS Code Claude Code UI

**Status**: 🟢 **IMPLEMENTED & VERIFIED**

We have implemented **Gemini 3.7 Flash** via Vertex AI for **VS Code Claude Code UI & CLI** to consume 100% of the Rp 5.3M ($300) GCP credit at **Rp 0 out of pocket**:

1. **Router Deployment**: `claude-code-gemini-vertex` running on `http://127.0.0.1:3456`
2. **Backend Engine**: Google Vertex AI `gemini-3.7-flash` on project `ohanid`
3. **Authentication**: Google Application Default Credentials (ADC)
4. **Target Interface**: VS Code Claude Code Extension (GUI Chat Panel & Integrated Terminal)
5. **Applied Patches**:
   - `alt=sse` streaming JSON array fix
   - `skip_thought_signature_validator` bypass for Gemini tool calls
6. **Required Cleanup to eliminate `claude-sonnet-4-5 not available` error**:
   - Purged `CLAUDE_CODE_USE_VERTEX` from Windows User Registry so Claude Code connects to the local Gemini router (`127.0.0.1:3456`) instead of attempting direct Anthropic calls.

