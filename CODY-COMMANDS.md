# 🤖 CODY COMMAND REFERENCE
**Quick reference for Ohan (updated 2026-08-05)**

---

## **CORE COMMANDS** (Type these to Cody)

### `!mobile`
**What it does**: Runs full 10-step mobile QA test  
**When to use**: After deploying changes to save/delete/export/auth flow  
**What happens**:
- Opens Chrome on your screen (you can watch it)
- Tests: Login → Create project → Camera → Upload → Edit → Reorder → Save → Export (PDF/PPT/DOC) → Delete
- Takes 3-5 minutes
- Cody reports: ✅ PASS (10/10) or ⚠ FAIL with step details

**Example**: Just type `!mobile` and Cody runs it

---

### `!save`
**What it does**: Saves current session progress to changelog  
**When to use**: End of work session or after major milestone  
**What happens**:
- Pauses conversation
- Creates/updates `changelog-YYYY-MM-DD.md` in `<GoogleDrive>/HitecApp/Safety/`
- New file each calendar day
- Logs what was fixed/changed

**Example**: Just type `!save` when you're done working

---

### `!rule`
**What it does**: Shows the core operating rules  
**When to use**: When you forget how Cody/Anti workflow works  
**What happens**:
- Displays the rule: Ohan=boss, Cody=brain/manager, Anti=hand/executor
- Reminds token-saving tips
- Shows exception rules

**Example**: Just type `!rule` anytime

---

### `!feed`
**What it does**: Fetches latest user feedback from Firestore and helps you fix issues  
**When to use**: Daily, or after production deployment  
**What happens**:
1. Cody fetches latest 5 feedback submissions
2. Shows you: issues, severity, user quotes, satisfaction
3. Asks: "fix" / "discuss" / "defer" / "next"
4. If you say "fix" → Cody generates Anti prompt
5. You paste to Anti → Anti fixes, builds, deploys

**Example**: Type `!feed` → wait for summary → say "fix"

---

## **HOW TO DELEGATE WORK TO ANTI**

### **Pattern**: Cody → Anti → Report Back

1. **You ask Cody** to do something (e.g., "fix the delete bug")
2. **Cody thinks** and creates instructions in a code snippet
3. **You copy** the code snippet and paste to Anti
4. **Anti executes** and reports back in this format:
   ```
   CHANGE 1: APPLIED — file.jsx:123
   BUILD: PASS
   DEPLOY: PASS
   ```
5. **You paste** Anti's report back to Cody
6. **Cody verifies** and confirms done

**Remember**: Anti always reports in CODE SNIPPET format

---

## **QUICK FIXES** (Common Problems)

### User reports "app is slow"
1. Type `!feed`
2. Say "fix"
3. Paste Anti prompt to Anti
4. Anti optimizes and deploys

### User reports "cannot delete"
1. Type `!feed`
2. Cody shows the issue
3. Say "fix"
4. Follow Anti prompt

### You want to test after a fix
1. Type `!mobile`
2. Wait 3-5 minutes
3. Cody shows: ✅ PASS or ⚠ FAIL

### You forget what you did yesterday
1. Open `<GoogleDrive>/HitecApp/Safety/changelog-2026-08-05.md`
2. Read the summary

---

## **FILE LOCATIONS** (Where Everything Lives)

```
📁 <GoogleDrive>/HitecApp/Safety/
  ├── changelog-YYYY-MM-DD.md         ← Daily work logs (!save creates this)
  ├── fetch_feedback.py               ← Fetches feedback from Firestore
  ├── latest_feedback.json            ← Latest 5 feedback submissions
  ├── update_feedback_status.py       ← Marks feedback as resolved
  ├── user-workflows.html             ← Full UX workflow documentation
  └── CODY-COMMANDS-REFERENCE.md      ← THIS FILE (you're reading it!)

📁 C:\Antigravity IDE\HitecApp\Safety\
  ├── .claude\commands\feed.md  ← !feed slash command
  ├── qa_mobile_test.cjs                   ← Mobile QA test script (!mobile)
  ├── src\components\Dashboard.jsx         ← Main app component
  ├── src\aiAssessor.js                    ← AI synthesis logic
  └── firestore.rules                      ← Database security rules

📁 C:\Users\Administrator\.claude\projects\...\memory\
  ├── feedback_patterns.md              ← Tracks recurring issues
  ├── feedback_slash_command.md         ← !feed workflow
  └── feedback_rule.md                  ← Core operating rules (!rule)
```

---

## **DAILY WORKFLOW EXAMPLE**

### Morning:
1. Type `!feed` → Check user feedback
2. Pick top issue → Say "fix"
3. Paste prompt to Anti → Anti fixes
4. Type `!mobile` → Verify fix works

### During Work:
- You tell Cody what to fix
- Cody writes Anti prompt
- You paste to Anti
- Anti reports back

### End of Day:
1. Type `!save` → Save progress to changelog
2. Check `<GoogleDrive>/HitecApp/Safety/changelog-YYYY-MM-DD.md`

---

## **REMEMBER**

✅ **Cody = Brain** (plans, diagnoses, verifies)  
✅ **Anti = Hand** (executes, builds, deploys)  
✅ **You = Boss** (decide what to fix, approve plans)

❌ **Cody never touches files** (except !mobile)  
❌ **Anti never plans** (only executes instructions)  
❌ **Never push without "yes, push to production"**

---

## **HOW TO USE THIS FILE**

Anytime you forget a command, just tell Cody:

> "Read the command reference"

or

> "What was the command for checking feedback?"

Cody will read this file and remind you!

---

**Last Updated**: 2026-08-05  
**Version**: 1.0  
**For**: Ohan (HitecApp-Safety Project)
