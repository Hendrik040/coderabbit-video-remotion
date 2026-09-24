export const FOLLOW_DIGEST_TIME_ZONE = 'America/Los_Angeles';

export interface FollowDigestPreferences {
  frequency: 'once' | 'twice';
  firstTime: string;
  secondTime: string;
}

export const defaultFollowDigestPreferences: FollowDigestPreferences = {
  frequency: 'twice',
  firstTime: '09:00',
  secondTime: '17:00',
};

/** Reads a time-input value, retaining a valid default for incomplete edits. */
const minutesFor = (value: string, fallback: number) => {
  if (!/^\d{2}:\d{2}$/.test(value)) return fallback;
  const [hour, minute] = value.split(':').map(Number);
  return hour < 24 && minute < 60 ? hour * 60 + minute : fallback;
};

/** Formats the next wall-clock delivery in the illustration's Los Angeles time zone. */
export const nextFollowDigest = (preferences: FollowDigestPreferences, now: Date, locale = 'en') => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: FOLLOW_DIGEST_TIME_ZONE,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map(part => [part.type, part.value])
  );
  const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute);
  const times = [minutesFor(preferences.firstTime, 9 * 60)];
  if (preferences.frequency === 'twice') times.push(minutesFor(preferences.secondTime, 17 * 60));
  times.sort((first, second) => first - second);
  const upcoming = times.find(time => time > currentMinutes);
  const deliveryMinutes = upcoming ?? times[0];
  // UTC here represents a local calendar date/time for formatting, not a delivery timestamp.
  const calendar = new Date(
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day) + (upcoming === undefined ? 1 : 0),
      Math.floor(deliveryMinutes / 60),
      deliveryMinutes % 60
    )
  );
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(calendar);
};
