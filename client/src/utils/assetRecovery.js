const RELOAD_KEY = 'medpro:asset-recovery';
const COOLDOWN_MS = 60_000;

export function isAssetLoadError(error) {
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Loading (?:CSS )?chunk .+ failed|ChunkLoadError/i.test(String(error?.message || error || ''));
}

// A stale tab can reference chunks removed by a newer deployment. Fetch the
// current entry document once; persistent network failures must not reload-loop.
export function createAssetRecovery({ storage, reload, now = Date.now, online = () => true }) {
  let attempted = false;
  return (error) => {
    if (!isAssetLoadError(error) || attempted || !online()) return false;
    try {
      const previous = Number(storage.getItem(RELOAD_KEY));
      if (previous && now() - previous < COOLDOWN_MS) return false;
      storage.setItem(RELOAD_KEY, String(now()));
    } catch {
      // Without durable storage, a reload cannot be guarded across page loads.
      return false;
    }
    attempted = true;
    reload();
    return true;
  };
}

export function recoverAssetLoad(error) {
  return browserRecovery?.(error) || false;
}

let browserRecovery;
if (typeof window !== 'undefined') {
  browserRecovery = createAssetRecovery({
    storage: {
      getItem: (key) => window.sessionStorage.getItem(key),
      setItem: (key, value) => window.sessionStorage.setItem(key, value),
    },
    reload: () => window.location.reload(),
    online: () => window.navigator.onLine,
  });
  window.addEventListener('vite:preloadError', (event) => {
    if (recoverAssetLoad(event.payload)) event.preventDefault();
  });
}
