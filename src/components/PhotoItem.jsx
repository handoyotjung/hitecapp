import React, { useState, useEffect } from 'react';
import { Mic as MicIcon } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';

export default function PhotoItem({ photo, onUpdateCaption, onSelectPhoto }) {
  const [caption, setCaption] = useState(photo.caption || photo.comments_text || '');
  const [isEditing, setIsEditing] = useState(false);
  const { isRecording, transcript, detectedLang, start, stop, supported } = useSpeechToText();

  useEffect(() => {
    setCaption(photo.caption || photo.comments_text || '');
  }, [photo.caption, photo.comments_text]);

  useEffect(() => {
    if (transcript && !isRecording) { // only save when user releases
      setCaption(transcript);
      if (onUpdateCaption) {
        onUpdateCaption(photo.id || photo.filename, transcript);
      }
    }
  }, [isRecording, transcript, photo.id, photo.filename, onUpdateCaption]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    start();
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    stop();
  };

  return (
    <div className="flex gap-3 p-3 border border-[#2B2B2B] bg-[#0F172A] rounded-lg items-center w-full min-w-0">
      <img 
        src={photo.thumbnail || photo.thumbnailUrl || photo.previewUrl || photo.url} 
        alt="thumbnail" 
        onClick={onSelectPhoto}
        className={`w-12 h-12 rounded object-cover shrink-0 border border-slate-800 ${onSelectPhoto ? 'cursor-pointer hover:opacity-80' : ''}`} 
      />
      <div className="flex-1 min-w-0">
        <p 
          onClick={onSelectPhoto} 
          className={`text-sm font-medium text-slate-200 truncate ${onSelectPhoto ? 'cursor-pointer hover:text-emerald-300' : ''}`}
        >
          {photo.filename}
        </p>
        
        <div className="flex items-center gap-2 mt-1">
          {isEditing ? (
            <input 
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onBlur={() => { 
                if (onUpdateCaption) onUpdateCaption(photo.id || photo.filename, caption); 
                setIsEditing(false); 
              }}
              autoFocus
              className="flex-1 bg-[#1F2937] text-white text-sm px-2 py-1 rounded outline-none border border-emerald-500/50"
            />
          ) : (
            <p onClick={() => setIsEditing(true)} className="flex-1 text-sm text-emerald-400 cursor-pointer truncate">
              {caption || 'No caption'}
            </p>
          )}

          {supported && (
            <button 
              type="button"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp} // cancel if finger slides out
              style={{ touchAction: 'manipulation' }}
              className={`p-2 rounded-full transition-all shrink-0 ${
                isRecording ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/30' : 'bg-[#1F2937] hover:bg-slate-700'
              }`}
              title="Hold to talk"
            >
              <MicIcon className={`w-4 h-4 ${isRecording ? 'text-white' : 'text-gray-400'}`} />
            </button>
          )}
        </div>

        {/* FEEDBACK WHILE RECORDING */}
        {isRecording && (
          <div className="flex items-center gap-1 mt-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-gray-400">Listening... {detectedLang === 'id-ID' ? 'ID' : 'EN'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
