// Thin wrapper around the browser's built-in speech synthesis so the
// simulation player can "read aloud" dispatch info and outcomes — no
// external TTS API/key required.
export function speak(text) {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.98;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function speechSupported() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}
