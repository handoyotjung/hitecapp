import React from 'react';
import { X, BookOpen } from 'lucide-react';

export function HelpModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-5 py-4 shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-400 border border-emerald-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">User Guide</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-6 text-sm text-slate-300">

          <section>
            <h3 className="text-white font-bold text-base mb-2">🔒 View Mode vs. Edit Mode</h3>
            <ul className="space-y-1.5 list-none">
              <li>✏️ <span className="text-white font-medium">Edit Mode</span> (default) — Add/edit photos, captions, grades, and project details</li>
              <li>👁️ <span className="text-white font-medium">View Mode</span> (locked) — View only, all inputs disabled</li>
              <li>💡 Tap <span className="text-emerald-400 font-medium">Save</span> → switches to View Mode (button changes to "Edit")</li>
              <li>💡 Tap <span className="text-emerald-400 font-medium">Edit</span> → unlocks for more changes</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">💾 Saving Your Work</h3>
            <ul className="space-y-1.5 list-none">
              <li>⚡ Autosaves as you work — no manual save needed</li>
              <li>🔒 <span className="text-emerald-400 font-medium">Save</span> button locks the screen and shows "Edit"</li>
              <li>✅ Button stays "Edit" during autosave cycles — no flickering</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">📸 Photos & Captions</h3>
            <ul className="space-y-1.5 list-none">
              <li>🖼️ Supported formats: JPEG, JPG, PNG, GIF, WEBP</li>
              <li><span className="text-emerald-400 font-medium">Green</span> text = has a caption ✅</li>
              <li><span className="text-yellow-400 font-medium">Yellow</span> text = needs a caption ⚠️</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">📋 Grades & ATEX Tags</h3>
            <ul className="space-y-1.5 list-none">
              <li>🏷️ Tap a photo to set its <span className="text-white font-medium">Grade</span> and <span className="text-white font-medium">ATEX tag</span></li>
              <li>⚠️ Required before a project can be marked complete</li>
              <li>⚡ Grades and tags sync automatically like captions</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">💬 Comments vs. Captions</h3>
            <ul className="space-y-1.5 list-none">
              <li>🏷️ <span className="text-white font-medium">Caption</span> = short label shown under the photo</li>
              <li>📝 <span className="text-white font-medium">Comments/Remarks</span> = longer notes, separate from the caption</li>
              <li>🔒 Editing one never overwrites the other</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">🗣️ Speech-to-Text Feedback</h3>
            <ul className="space-y-1.5 list-none">
              <li>🎤 Tap the <span className="text-white font-medium">Mic</span> button in the Feedback modal</li>
              <li>🗣️ Speak your feedback — auto-transcribed</li>
              <li>✏️ Review text → tap <span className="text-white font-medium">Send</span></li>
              <li>📱 Works on Android Chrome + desktop; iOS degrades gracefully</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">📄 Exporting Reports</h3>
            <ul className="space-y-1.5 list-none">
              <li>📁 Filename format: <span className="text-white font-mono text-xs bg-slate-800 px-1.5 py-0.5 rounded">Company City Year.pdf</span></li>
              <li>📝 Example: <span className="text-white font-mono text-xs bg-slate-800 px-1.5 py-0.5 rounded">PT Safety Indonesia Utama Jakarta 2026.pdf</span></li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">🤖 AI Assessor Recommendations</h3>
            <ul className="space-y-1.5 list-none">
              <li>✍️ <span className="text-white font-medium">Manual</span> — you write all recommendations yourself</li>
              <li>💡 <span className="text-white font-medium">Suggestions</span> — AI drafts a recommendation, you review and edit before saving</li>
              <li>⏳ AI agent mode is not yet available</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">🔄 Switching Projects</h3>
            <ul className="space-y-1.5 list-none">
              <li>📂 Use the dropdown to switch projects</li>
              <li>🔓 View Mode resets automatically on switch</li>
              <li>💾 Work is autosaved before switching</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">🔄 Multi-Device Sync</h3>
            <ul className="space-y-1.5 list-none">
              <li>📱 Your account can be used on multiple devices at once</li>
              <li>⚡ Projects and edits sync automatically across devices</li>
              <li>🔄 If a project doesn't appear on another device, wait a few seconds and refresh</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">🔒 Session & Login</h3>
            <ul className="space-y-1.5 list-none">
              <li>⏱️ You'll be logged out automatically after a period of inactivity</li>
              <li>💾 Unsaved edits are autosaved before a session expires, so work isn't lost</li>
              <li>🔑 Just log back in to continue where you left off</li>
            </ul>
          </section>

          <div className="pt-2 pb-1 text-center text-xs text-slate-500">HitecApp Safety — Mobile User Guide</div>
        </div>
      </div>
    </div>
  );
}
