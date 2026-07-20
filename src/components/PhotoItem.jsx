import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic as MicIcon } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';

export default function PhotoItem({ photo, onUpdateCaption, onSelectPhoto }) {
  const [caption, setCaption] = useState(photo.caption || '');
  const [isEditing, setIsEditing] = useState(false);
  const { isRecording, transcript, detectedLang, start, stop, supported } = useSpeechToText();

  // Track the last photo identity we synced from, so we only reset on actual photo change
  const lastPhotoIdRef = useRef(photo.id || photo.filename);
  // Track whether the textarea currently has focus (user is actively typing)
  const isFocusedRef = useRef(false);

  // Only sync caption from prop when the photo itself changes identity (different photo).
  // NEVER overwrite while the user has focus or is recording — that causes the reversion bug.
  useEffect(() => {
    const currentId = photo.id || photo.filename;
    if (currentId !== lastPhotoIdRef.current) {
      // Different photo entirely — reset everything
      lastPhotoIdRef.current = currentId;
      setCaption(photo.caption || '');
      setIsEditing(false);
    } else if (!isFocusedRef.current && !isRecording && !isEditing) {
      // Same photo, not focused, not recording, not in edit mode — safe to sync
      const incoming = photo.caption || '';
      setCaption(incoming);
    }
  }, [photo.id, photo.filename, photo.caption, isRecording, isEditing]);

  // Commit speech transcript once recording stops
  useEffect(() => {
    if (transcript && !isRecording) {
      setCaption(transcript);
      if (onUpdateCaption) {
        onUpdateCaption(photo.id || photo.filename, transcript);
      }
    }
  }, [isRecording, transcript]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMicPointerDown = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    start();
  };

  const handleMicPointerUp = (e) => {
    e.stopPropagation();
    stop();
  };

  const handleChange = useCallback((e) => {
    setCaption(e.target.value);
  }, []);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    if (onUpdateCaption) {
      onUpdateCaption(photo.id || photo.filename, caption);
    }
  }, [caption, photo.id, photo.filename, onUpdateCaption]);

  const handleClear = useCallback((e) => {
    e.stopPropagation();
    setCaption('');
    if (onUpdateCaption) onUpdateCaption(photo.id || photo.filename, '');
  }, [photo.id, photo.filename, onUpdateCaption]);

  const handleSave = useCallback((e) => {
    e.stopPropagation();
    isFocusedRef.current = false;
    if (onUpdateCaption) onUpdateCaption(photo.id || photo.filename, caption);
    setIsEditing(false);
  }, [caption, photo.id, photo.filename, onUpdateCaption]);

  return (
    <div className="flex flex-col gap-2 p-3 border border-[#2B2B2B] bg-[#0F172A] rounded-lg w-full min-w-0">
      {/* TOP LINE: Thumbnail (w-12 h-12) + Filename/Summary + Mic Button (w-12 h-12) located on same line next to checkmark */}
      <div className="flex items-center justify-between gap-3 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img 
            src={photo.thumbnail || photo.thumbnailUrl || photo.previewUrl || photo.url} 
            alt="thumbnail" 
            onClick={onSelectPhoto}
            className={`w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-800 ${onSelectPhoto ? 'cursor-pointer hover:opacity-80' : ''}`} 
          />
          <div className="min-w-0 flex-1">
            <p 
              onClick={onSelectPhoto} 
              className={`text-sm font-semibold text-slate-200 truncate ${onSelectPhoto ? 'cursor-pointer hover:text-emerald-300' : ''}`}
            >
              {photo.filename}
            </p>
            {!isEditing && (
              <p 
                onClick={() => setIsEditing(true)} 
                title="Click to expand 5-row caption editor"
                className="text-xs text-emerald-400 cursor-pointer truncate mt-0.5 hover:underline"
              >
                {caption || 'No caption (click to expand editor)'}
              </p>
            )}
          </div>
        </div>

        {/* Mic Button: exact same dimensions (w-12 h-12) as photo thumbnail, right across in same line */}
        {supported && (
          <button 
            type="button"
            onPointerDown={handleMicPointerDown}
            onPointerUp={handleMicPointerUp}
            onPointerLeave={handleMicPointerUp}
            style={{ touchAction: 'manipulation' }}
            className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center transition-all shrink-0 border ${
              isRecording 
                ? 'bg-red-500 border-red-400 scale-105 shadow-lg shadow-red-500/30 text-white' 
                : 'bg-[#1F2937] hover:bg-slate-700 border-slate-700 text-emerald-400'
            }`}
            title="Hold to talk"
          >
            <MicIcon className={`w-5 h-5 ${isRecording ? 'text-white animate-bounce' : 'text-emerald-400'}`} />
            <span className="text-[9px] font-bold uppercase mt-0.5 leading-none">{isRecording ? 'Rec' : 'Mic'}</span>
          </button>
        )}
      </div>

      {/* CAPTION EDITOR: auto expands to 5 rows when open, with red X on top right and green checkmark on bottom right */}
      {(isEditing || isRecording) && (
        <div className="relative w-full mt-1">
          <textarea 
            rows={5}
            value={caption}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoFocus={isEditing && !isRecording}
            placeholder="Type or hold mic to speak caption..."
            className="w-full bg-[#1F2937] text-white text-xs p-2.5 pr-8 rounded-lg outline-none border border-emerald-500/60 focus:border-emerald-400 resize-y"
          />
          {/* Red X on right top corner of caption textfield to clear all text */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()} // prevent onBlur when clicking X
            onClick={handleClear}
            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900/95 border border-red-500/50 text-red-400 hover:text-red-300 hover:bg-slate-800 flex items-center justify-center text-xs font-bold leading-none transition-colors shadow z-10"
            title="Clear all caption text"
          >
            ✕
          </button>

          {/* Green checkmark on bottom right corner (same column with red X) to save and close */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()} // prevent onBlur when clicking checkmark
            onClick={handleSave}
            className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-slate-900/95 border border-emerald-500/60 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 flex items-center justify-center text-xs font-bold leading-none transition-colors shadow z-10"
            title="Save caption and close editor"
          >
            ✓
          </button>

          {isRecording && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-red-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Listening... ({detectedLang === 'id-ID' ? 'Indonesian' : 'English'})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
