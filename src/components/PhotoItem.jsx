import React, { useState, useEffect } from 'react';
import { Mic as MicIcon } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';

export default function PhotoItem({ photo, onUpdateCaption, onSelectPhoto }) {
  const [caption, setCaption] = useState(photo.caption || photo.comments_text || '');
  const [isEditing, setIsEditing] = useState(false);
  const { isRecording, transcript, detectedLang, start, stop, supported } = useSpeechToText();

  useEffect(() => {
    if (!isEditing && !isRecording) {
      setCaption(photo.caption || photo.comments_text || '');
    }
  }, [photo.caption, photo.comments_text, isEditing, isRecording]);

  useEffect(() => {
    if (transcript && !isRecording) { // only save when user releases mic
      setCaption(transcript);
      if (onUpdateCaption) {
        onUpdateCaption(photo.id || photo.filename, transcript);
      }
    }
  }, [isRecording, transcript, photo.id, photo.filename, onUpdateCaption]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setIsEditing(true); // auto expand to 5 rows when mic is held
    start();
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    stop();
  };

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
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
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
            onChange={(e) => setCaption(e.target.value)}
            onBlur={() => { 
              if (onUpdateCaption) onUpdateCaption(photo.id || photo.filename, caption); 
            }}
            autoFocus={isEditing}
            placeholder="Type or hold mic to speak caption..."
            className="w-full bg-[#1F2937] text-white text-xs p-2.5 pr-8 rounded-lg outline-none border border-emerald-500/60 focus:border-emerald-400 resize-y"
          />
          {/* Red X on right top corner of caption textfield to clear all text */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()} // prevent onBlur when clicking X
            onClick={(e) => {
              e.stopPropagation();
              setCaption('');
              if (onUpdateCaption) onUpdateCaption(photo.id || photo.filename, '');
            }}
            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900/95 border border-red-500/50 text-red-400 hover:text-red-300 hover:bg-slate-800 flex items-center justify-center text-xs font-bold leading-none transition-colors shadow z-10"
            title="Clear all caption text"
          >
            ✕
          </button>

          {/* Green checkmark on bottom right corner (same column with red X) to save and close */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()} // prevent onBlur when clicking checkmark
            onClick={(e) => {
              e.stopPropagation();
              if (onUpdateCaption) onUpdateCaption(photo.id || photo.filename, caption);
              setIsEditing(false);
            }}
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
