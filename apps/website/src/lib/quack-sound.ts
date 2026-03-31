let audioCtx: AudioContext | null = null;
let cachedBuffer: AudioBuffer | null = null;
let loadingPromise: Promise<void> | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function loadBuffer(): Promise<void> {
  if (cachedBuffer) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = fetch("/quack.mp3")
    .then((res) => res.arrayBuffer())
    .then((buf) => getContext().decodeAudioData(buf))
    .then((decoded) => {
      cachedBuffer = decoded;
    })
    .catch(() => {});

  return loadingPromise;
}

export function playQuackSound() {
  try {
    const ctx = getContext();

    void loadBuffer().then(() => {
      if (!cachedBuffer) return;

      const source = ctx.createBufferSource();
      source.buffer = cachedBuffer;
      source.playbackRate.value = 1.2;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 2800;
      filter.Q.value = 0.9;

      const gain = ctx.createGain();
      gain.gain.value = 0.2;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start();
    });
  } catch {
    // Audio not available
  }
}
