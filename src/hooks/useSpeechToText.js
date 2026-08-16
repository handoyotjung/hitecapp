import { useState, useRef } from 'react';

export function useSpeechToText() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedLang, setDetectedLang] = useState('id-ID');
  const recognitionRef = useRef({ recognition: null, finalText: '', startTime: 0, aborted: false });

  const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const correctEnglish = (text) => {
    if (!text) return '';
    return text
      .replace(/\bi\b/g, 'I')
      .replace(/\bim\b/gi, "I'm")
      .replace(/\bdont\b/gi, "don't")
      .replace(/\bwont\b/gi, "won't")
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const tryLang = (lang) => {
    if (!SpeechRecognition) return;
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.interimResults = true;
      recognition.continuous = false;
      setDetectedLang(lang);

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onend = () => {
        setIsRecording(false);
        // If ID returned empty and not aborted, try EN once
        if (!recognitionRef.current.finalText && lang === 'id-ID' && !recognitionRef.current.aborted) {
          tryLang('en-US');
        }
      };

      recognition.onresult = (event) => {
        if (recognitionRef.current.aborted) return;
        let text = Array.from(event.results).map(r => r[0].transcript).join('');
        recognitionRef.current.finalText = text;
        if (lang === 'en-US') {
          text = correctEnglish(text);
        } else {
          text = text.trim();
          if (text && text.length > 0) {
            text = text.charAt(0).toUpperCase() + text.slice(1);
          }
        }
        setTranscript(text);
      };

      recognition.onerror = (event) => {
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please allow microphone access in your browser settings to use voice features.');
        } else if (event.error === 'audio-capture') {
          alert('No microphone found. Please ensure a microphone is connected.');
        } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.warn("Speech recognition error:", event.error);
        }
      };

      recognitionRef.current.recognition = recognition;
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setIsRecording(false);
    }
  };

  const start = () => {
    if (!SpeechRecognition) return;
    
    // Toggle behavior for quick taps on mobile
    if (isRecording) {
      recognitionRef.current.aborted = false;
      recognitionRef.current.recognition?.stop();
      setIsRecording(false);
      return;
    }

    setTranscript('');
    recognitionRef.current = { recognition: null, finalText: '', startTime: Date.now(), aborted: false };
    tryLang('id-ID');
  };

  const stop = (force = false) => {
    if (!isRecording && !force) return;
    const duration = Date.now() - (recognitionRef.current.startTime || 0);
    
    // If it was a quick tap (< 400ms), assume user wants tap-to-toggle instead of hold-to-talk.
    // So we ignore the pointerUp stop event and let it keep recording.
    if (!force && duration < 400) {
      return;
    }
    
    recognitionRef.current.aborted = false;
    recognitionRef.current.recognition?.stop();
    setIsRecording(false);
  };

  return { isRecording, transcript, detectedLang, start, stop, supported: !!SpeechRecognition };
}
