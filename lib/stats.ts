export const STATS_KEY = 'spoilerStats';

export type SpoilerStats = {
  hidden: number;
  hiddenToday: number;
  day: string;
  feedbackSent: number;
};

export type StatEvent = 'hidden' | 'feedbackSent';

export function updateStats(current: SpoilerStats | undefined, event: StatEvent, day: string): SpoilerStats {
  const stats: SpoilerStats = {
    hidden: current?.hidden ?? 0,
    hiddenToday: current?.day === day ? current.hiddenToday : 0,
    day,
    feedbackSent: current?.feedbackSent ?? 0,
  };
  if (event === 'hidden') {
    stats.hidden++;
    stats.hiddenToday++;
  } else {
    stats.feedbackSent++;
  }
  return stats;
}
