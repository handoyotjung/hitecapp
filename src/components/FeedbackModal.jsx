import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, CheckCircle2, Loader2, Sparkles, User } from 'lucide-react';
import { aiFeedbackChatStep, aiFeedbackSynthesize } from '../aiAssessor';
import { db, collection, addDoc } from '../firebase';

export function FeedbackModal({ open, onClose, user, isPro = false, lang = 'ID' }) {
  const isId = lang === 'ID';
  const [history, setHistory] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [loadingStep, setLoadingStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize opening question when opened
  useEffect(() => {
    if (open && history.length === 0 && !submitted) {
      initChat();
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loadingStep, submitted]);

  const initChat = async () => {
    setLoadingStep(true);
    try {
      const opening = await aiFeedbackChatStep([], '', 0, lang);
      setHistory([{ role: 'assistant', text: opening }]);
      setStepIndex(1);
    } catch (e) {
      console.error('Feedback init error:', e);
    } finally {
      setLoadingStep(false);
    }
  };

  const handleSendAnswer = async (e) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || loadingStep || submitting) return;

    const userText = inputVal.trim();
    setInputVal('');

    const newHistory = [...history, { role: 'user', text: userText }];
    setHistory(newHistory);
    setLoadingStep(true);

    try {
      const nextAssistantMsg = await aiFeedbackChatStep(newHistory, userText, stepIndex, lang);
      setHistory([...newHistory, { role: 'assistant', text: nextAssistantMsg }]);
      setStepIndex(prev => prev + 1);
    } catch (err) {
      console.error('Feedback chat step error:', err);
    } finally {
      setLoadingStep(false);
    }
  };

  const handleFinishAndSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const currentHistory = [...history];
      if (inputVal.trim()) {
        currentHistory.push({ role: 'user', text: inputVal.trim() });
      }

      // Perform server-side / data-access synthesis
      const synthesis = await aiFeedbackSynthesize(
        currentHistory,
        user?.email || 'Anonymous',
        isPro ? 'pro' : 'starter',
        lang
      );

      const record = {
        userEmail: user?.email || 'anonymous@hitec.id',
        userId: user?.uid || user?.email || 'anonymous',
        planTier: isPro ? 'pro' : 'starter',
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        transcript: currentHistory,
        title: synthesis.title,
        summary: synthesis.summary,
        satisfaction_note: synthesis.satisfaction_note,
        issues: synthesis.issues || [],
        feature_requests: synthesis.feature_requests || [],
        antigravity_prompt: synthesis.antigravity_prompt || ''
      };

      const fullRecord = { id: 'fb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7), ...record };

      // 1. Immediately save to localStorage (hitecmedia_mock_db & hitec_feedback_backlog) so /admin.html sees it instantly
      try {
        const cached = localStorage.getItem('hitecmedia_mock_db');
        const store = cached ? JSON.parse(cached) : {};
        if (!Array.isArray(store.feedback)) store.feedback = [];
        store.feedback = store.feedback.filter(item => item.id !== fullRecord.id);
        store.feedback.unshift(fullRecord);
        localStorage.setItem('hitecmedia_mock_db', JSON.stringify(store));
        localStorage.setItem('hitec_feedback_backlog', JSON.stringify(store.feedback));

        // Dispatch storage event & BroadcastChannel for instant live sync across open tabs
        window.dispatchEvent(new CustomEvent('hitec_feedback_submitted', { detail: fullRecord }));
        try {
          const bc = new BroadcastChannel('hitec_feedback_channel');
          bc.postMessage(fullRecord);
          bc.close();
        } catch (bcErr) {}
      } catch (errLocal) {
        console.warn('Could not save feedback to localStorage:', errLocal);
      }

      // 2. POST to /api/feedback endpoint for real-time cross-device & incognito cloud sync
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullRecord)
        });
      } catch (errApi) {
        console.warn('API feedback post note:', errApi);
      }

      // 3. Persist feedback to Firebase / Firestore store
      try {
        await addDoc(collection(db, 'feedback'), fullRecord);
      } catch (errFb) {
        console.warn('Firestore feedback addDoc error:', errFb);
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (submitted) {
      setHistory([]);
      setStepIndex(0);
      setInputVal('');
      setSubmitted(false);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={handleCloseModal}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-400 border border-emerald-500/30">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Feedback Agent
              </h2>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="rounded-full bg-emerald-500/15 p-4 text-emerald-400 border border-emerald-500/30 mb-4 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {isId ? 'Terima Kasih atas Masukan Anda!' : 'Thank You for Your Feedback!'}
            </h3>
            <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
              {isId
                ? 'Cerita dan masukan Anda telah tersimpan dengan aman untuk tim pengembangan kami. Kontribusi Anda sangat berharga untuk meningkatkan kualitas HitecApp.'
                : 'Your feedback has been securely submitted to our product team. Your insights help us continually enhance HitecApp.'}
            </p>
            <button
              onClick={handleCloseModal}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              {isId ? 'Kembali ke Aplikasi' : 'Return to Application'}
            </button>
          </div>
        ) : (
          <>
            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-[280px] max-h-[460px]">
              {history.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm max-w-[82%] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-xs shadow-md'
                        : 'bg-slate-950/70 border border-slate-800 text-slate-200 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {loadingStep && (
                <div className="flex items-center gap-2.5 text-xs text-slate-400 pl-11">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  <span>{isId ? 'AI sedang merespons...' : 'AI is replying...'}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input & Footer Action Bar */}
            <div className="border-t border-slate-800 bg-slate-950/60 p-4 shrink-0">
              <form onSubmit={handleSendAnswer} className="flex gap-2">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={
                    isId
                      ? 'Ketik masukan atau jawaban Anda di sini (boleh santai/non-formal)...'
                      : 'Type your feedback or thoughts here...'
                  }
                  disabled={loadingStep || submitting}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || loadingStep || submitting}
                  className="flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-40"
                  title={isId ? 'Kirim Jawaban' : 'Send Answer'}
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60">
                <span className="text-[11px] text-slate-400">
                  {isId
                    ? 'Bisa tekan tombol Selesai kapan saja bila sudah cukup.'
                    : 'Click Done & Submit anytime when you are finished.'}
                </span>
                <button
                  type="button"
                  onClick={handleFinishAndSubmit}
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-600 hover:text-white px-4 py-2 text-xs font-bold text-emerald-400 transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isId ? 'Selesai & Kirim Masukan' : 'Done & Submit Feedback'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
