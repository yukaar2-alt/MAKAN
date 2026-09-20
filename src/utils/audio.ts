// Synthesized modern chime bell using Web Audio API (no external file dependencies)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playCashierAlertChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Harmonic double chime (G5 -> C6)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    // Frequencies: 783.99 Hz (G5) then sliding up to 1046.50 Hz (C6)
    osc1.frequency.setValueAtTime(784, now);
    osc1.frequency.exponentialRampToValueAtTime(1046, now + 0.15);

    osc2.frequency.setValueAtTime(1174, now); // D6 overtone
    osc2.frequency.exponentialRampToValueAtTime(1568, now + 0.15); // G6 overtone

    // Envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.35, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.85);
    osc2.stop(now + 0.85);

    // Second bounce chime for emphasis
    setTimeout(() => {
      try {
        const bounceCtx = getAudioContext();
        const bounceNow = bounceCtx.currentTime;
        const oscBounce = bounceCtx.createOscillator();
        const bounceGain = bounceCtx.createGain();

        oscBounce.type = "sine";
        oscBounce.frequency.setValueAtTime(1318.5, bounceNow); // E6

        bounceGain.gain.setValueAtTime(0, bounceNow);
        bounceGain.gain.linearRampToValueAtTime(0.3, bounceNow + 0.03);
        bounceGain.gain.exponentialRampToValueAtTime(0.001, bounceNow + 0.7);

        oscBounce.connect(bounceGain);
        bounceGain.connect(bounceCtx.destination);

        oscBounce.start(bounceNow);
        oscBounce.stop(bounceNow + 0.75);
      } catch {
        // audio context blocked
      }
    }, 180);
  } catch (err) {
    console.warn("Unable to play audio alert:", err);
  }
}

export function requestBrowserNotification(title: string, options?: NotificationOptions): void {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, options);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, options);
      }
    });
  }
}
