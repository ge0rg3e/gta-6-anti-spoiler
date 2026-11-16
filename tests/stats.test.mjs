import assert from 'node:assert/strict';
import test from 'node:test';
import { updateStats } from '../lib/stats.ts';

test('counts hidden content, feedback, and the current day', () => {
  const first = updateStats(undefined, 'hidden', '2026-11-15');
  const second = updateStats(first, 'feedbackSent', '2026-11-15');
  const nextDay = updateStats(second, 'hidden', '2026-11-16');

  assert.deepEqual(first, { hidden: 1, hiddenToday: 1, day: '2026-11-15', feedbackSent: 0 });
  assert.deepEqual(second, { hidden: 1, hiddenToday: 1, day: '2026-11-15', feedbackSent: 1 });
  assert.deepEqual(nextDay, { hidden: 2, hiddenToday: 1, day: '2026-11-16', feedbackSent: 1 });
});
