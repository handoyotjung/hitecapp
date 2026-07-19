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
        // If ID returned empty and not aborted by <300ms quick release, try EN once
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
          // If in ID mode but looks like English words or after correction, keep clean
          text = text.trim();
          if (text && text.length > 0) {
            text = text.charAt(0).toUpperCase() + text.slice(1);
          }
        }
        setTranscript(text);
      };

      recognition.onerror = (event) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
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
    setTranscript('');
    recognitionRef.current = { recognition: null, finalText: '', startTime: Date.now(), aborted: false };
    tryLang('id-ID');
  };

  const stop = () => {
    const duration = Date.now() - (recognitionRef.current.startTime || 0);
    if (duration < 300) {
      recognitionRef.current.aborted = true;
      recognitionRef.current.recognition?.abort();
      setIsRecording(false);
      setTranscript('');
      return;
    }
    recognitionRef.current.recognition?.stop();
  };

  return { isRecording, transcript, detectedLang, start, stop, supported: !!SpeechRecognition };
}
