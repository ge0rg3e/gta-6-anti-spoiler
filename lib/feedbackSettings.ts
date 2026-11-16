export const FEEDBACK_ENABLED_KEY = 'recommendationFeedbackEnabled';
export const FEEDBACK_CONSENT_KEY = 'recommendationFeedbackConsentGiven';

export function canSendFeedback(settings: Record<string, unknown>): boolean {
  return settings[FEEDBACK_ENABLED_KEY] === true && settings[FEEDBACK_CONSENT_KEY] === true;
}
