import './style.css';
import { canSendFeedback, FEEDBACK_CONSENT_KEY, FEEDBACK_ENABLED_KEY } from '../../lib/feedbackSettings';
import { STATS_KEY, type SpoilerStats } from '../../lib/stats';

const blockerKey = 'spoilerBlockerEnabled';
const toggle = document.querySelector<HTMLInputElement>('#enabled')!;
const feedbackToggle = document.querySelector<HTMLInputElement>('#feedback')!;
const status = document.querySelector<HTMLElement>('#status')!;
const hiddenCount = document.querySelector<HTMLElement>('#hidden-count')!;
const todayCount = document.querySelector<HTMLElement>('#today-count')!;
const feedbackCount = document.querySelector<HTMLElement>('#feedback-count')!;

function render(): void {
  status.textContent = toggle.checked ? 'Protected' : 'Paused';
  status.classList.toggle('paused', !toggle.checked);
}

function renderStats(stats?: SpoilerStats): void {
  const now = new Date();
  const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  hiddenCount.textContent = (stats?.hidden ?? 0).toLocaleString();
  todayCount.textContent = (stats?.day === day ? stats.hiddenToday : 0).toLocaleString();
  feedbackCount.textContent = (stats?.feedbackSent ?? 0).toLocaleString();
}

browser.storage.local.get([blockerKey, FEEDBACK_ENABLED_KEY, FEEDBACK_CONSENT_KEY, STATS_KEY]).then(result => {
  toggle.checked = result[blockerKey] !== false;
  feedbackToggle.checked = canSendFeedback(result);
  render();
  renderStats(result[STATS_KEY] as SpoilerStats | undefined);
});
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STATS_KEY]) renderStats(changes[STATS_KEY].newValue as SpoilerStats);
});
toggle.addEventListener('change', async () => {
  await browser.storage.local.set({ [blockerKey]: toggle.checked });
  render();
});
feedbackToggle.addEventListener('change', async () => {
  const values: Record<string, boolean> = feedbackToggle.checked
    ? { [FEEDBACK_ENABLED_KEY]: true, [FEEDBACK_CONSENT_KEY]: true }
    : { [FEEDBACK_ENABLED_KEY]: false };
  await browser.storage.local.set(values);
});
