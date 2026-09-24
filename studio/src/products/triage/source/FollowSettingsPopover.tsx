'use client';

import { BellAlertIcon } from '@heroicons/react/24/outline';
import { Cog6ToothIcon } from '@heroicons/react/16/solid';
import { Form } from './carrot';
import {useContext, type RefObject} from 'react';
import {TriageMotion, useTriageState} from './TriageEditor';
import { useLocale, useTranslations } from './messages';
import CarrotPressable from '../../change-stack/source/CarrotPressable';
import { FOLLOW_DIGEST_TIME_ZONE, nextFollowDigest, type FollowDigestPreferences } from './followDigest';
import styles from './ResourceBoard.module.css';

/** Settings for the marketing board's local follow state and digest schedule. */
export default function FollowSettingsPopover({
  id,
  panelRef,
  preferences,
  onChange,
  onUnfollow,
}: {
  id: string;
  panelRef: RefObject<HTMLDivElement | null>;
  preferences: FollowDigestPreferences;
  onChange: (preferences: FollowDigestPreferences) => void;
  onUnfollow: () => void;
}) {
  const t = useTranslations('Triage.board');
  const locale = useLocale();
  const [editingTimes, setEditingTimes] = useTriageState('editingTimes', false);
  const {clockFrame, fps} = useContext(TriageMotion);
  const now = new Date(Date.UTC(2026, 8, 24, 15, 30) + Math.floor(clockFrame / fps) * 1000);
  const currentTime = new Intl.DateTimeFormat(locale, {
    timeZone: FOLLOW_DIGEST_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(now);
  return (
    <div
      id={id}
      ref={panelRef}
      tabIndex={-1}
      role='dialog'
      aria-label={t('followSettings')}
      className={`${styles.popover} ${styles.popoverFollow}`}>
      <div className={styles.followHeading}>
        <BellAlertIcon className={styles.followHeadingIcon} aria-hidden='true' />
        <span>{t('followSettings')}</span>
        <CarrotPressable
          className={styles.control}
          aria-label={t('editDigestTimes')}
          title={t('editDigestTimes')}
          aria-expanded={editingTimes}
          aria-controls={editingTimes ? `${id}-times` : undefined}
          onClick={() => {
            setEditingTimes(current => !current);
          }}>
          <Cog6ToothIcon className={styles.controlIcon} aria-hidden='true' />
        </CarrotPressable>
      </div>
      <div className={styles.followFrequency}>
        <span>{t('dailyDigest')}</span>
        <div className={styles.segmentedControl} role='group' aria-label={t('dailyDigest')}>
          {(['once', 'twice'] as const).map(frequency => (
            <CarrotPressable
              key={frequency}
              className={`${styles.segment} ${preferences.frequency === frequency ? styles.segmentActive : ''}`}
              aria-pressed={preferences.frequency === frequency}
              onClick={() => {
                onChange({ ...preferences, frequency });
              }}>
              {t(frequency === 'once' ? 'onceDaily' : 'twiceDaily')}
            </CarrotPressable>
          ))}
        </div>
      </div>
      {editingTimes ? (
        <div id={`${id}-times`} className={styles.followTimes}>
          {(['firstTime', ...(preferences.frequency === 'twice' ? (['secondTime'] as const) : [])] as const).map(
            (field, index) => (
              <label key={field} htmlFor={`${id}-${field}`}>
                <span>{t(index === 0 ? 'firstDigest' : 'secondDigest')}</span>
                <Form.Input
                  id={`${id}-${field}`}
                  type='time'
                  value={preferences[field]}
                  className={styles.followTimeInput}
                  onChange={event => {
                    if (event.target.value && event.target.validity.valid)
                      onChange({ ...preferences, [field]: event.target.value });
                  }}
                />
              </label>
            )
          )}
        </div>
      ) : null}
      <div className={styles.followFooter}>
        <span className={styles.followSchedule}>
          <span>{t('nextDigest', { delivery: nextFollowDigest(preferences, now, locale) })}</span>
          <time dateTime={now.toISOString()} title={FOLLOW_DIGEST_TIME_ZONE}>
            {t('currentTime', { time: currentTime })}
          </time>
        </span>
        <CarrotPressable className={styles.unfollowButton} onClick={onUnfollow}>
          {t('unfollow')}
        </CarrotPressable>
      </div>
    </div>
  );
}
