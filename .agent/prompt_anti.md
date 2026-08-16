# Prompt for Anti - Fallback Protocol

## Purpose
Formatted prompt for Anti to send instructions through the legacy relay (fenced code snippet → Ohan copies to Cody).

---

## Anti, please send your instructions below:

```bash
# ==========================================
# ANTI INSTRUCTIONS PROMPT
# via Legacy Relay (Fallback Protocol)
# ==========================================
 
# TASK CONTEXT:
# - Project: HitecApp Safety (C:\Antigravity IDE\HitecApp\Safety)
# - Current task: Client UI/UX Survey Platform (from cody_task.txt)
# - Communication: Fallback protocol (fenced code snippet)
# - Constraints: No terminal access, HTTP bridge timed out
 
# REQUEST:
# Please provide instructions for what you want Cody to execute.
# Format your response as a fenced code snippet (triple backticks with bash label)
# that Ohan can copy directly into Cody.
 
# SPECIFIC REQUESTS (choose or describe):
# 1. Survey platform feature to implement/fix
# 2. Code modifications needed
# 3. Test or build verification
# 4. Firebase/progress.html updates
# 5. Other project tasks
 
# EXAMPLE FORMAT - Ohan will copy this to Cody:
# ```
# #!/bin/bash
# # Anti instructions for Cody execution
# echo "Starting task: <description>"
# # ... specific code changes, tests, builds
# echo "CHANGE 1: APPLIED / BUILD: PASS / TEST: PASS"
# ```
 
# WHAT I NEED FROM ANTI:
# - Clear, compact instructions
# - Specific file paths or code snippets
# - Expected outcome (CHANGE: APPLIED / BUILD: PASS / TEST: PASS format)
# - Priority level (what should Cody do first)
 
# ==========================================
# END ANTI INSTRUCTIONS PROMPT
# ==========================================
```