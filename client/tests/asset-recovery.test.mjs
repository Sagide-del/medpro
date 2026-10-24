import test from 'node:test';
import assert from 'node:assert/strict';
import { createAssetRecovery, isAssetLoadError } from '../src/utils/assetRecovery.js';
const error = new TypeError('Failed to fetch dynamically imported module: /assets/Dashboard-old.js');
function storage() { const data = new Map(); return { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) }; }

test('an outdated chunk refreshes once, retaining a cross-reload guard', () => {
  const saved = storage(); let reloads = 0;
  const options = { storage: saved, reload: () => reloads++, now: () => 100_000 };
  const recover = createAssetRecovery(options);
  assert.equal(recover(error), true);
  assert.equal(recover(error), false);
  assert.equal(createAssetRecovery(options)(error), false);
  assert.equal(reloads, 1);
});
test('offline, inaccessible storage, and application errors do not auto-refresh', () => {
  const reload = () => assert.fail('Must not reload');
  assert.equal(createAssetRecovery({ storage: storage(), reload, online: () => false })(error), false);
  assert.equal(createAssetRecovery({ storage: { getItem() { throw Error('Blocked'); } }, reload })(error), false);
  assert.equal(createAssetRecovery({ storage: storage(), reload })(Error('Invalid account')), false);
  assert.equal(isAssetLoadError(Error('Importing a module script failed.')), true);
});
