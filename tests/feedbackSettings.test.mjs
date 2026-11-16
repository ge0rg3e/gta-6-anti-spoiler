import assert from 'node:assert/strict';
import test from 'node:test';
import { canSendFeedback } from '../lib/feedbackSettings.ts';

test('YouTube feedback stays off for new and existing installs until explicit opt-in', () => {
  assert.equal(canSendFeedback({}), false);
  assert.equal(canSendFeedback({ recommendationFeedbackEnabled: true }), false);
  assert.equal(canSendFeedback({ recommendationFeedbackConsentGiven: true }), false);
  assert.equal(canSendFeedback({ recommendationFeedbackEnabled: true, recommendationFeedbackConsentGiven: true }), true);
});
