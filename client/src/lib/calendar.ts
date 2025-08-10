import { Webinar } from '@shared/types';

function pad(n: number) { return String(n).padStart(2, '0'); }

function toUTCString(date: Date) {
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mm = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

export function buildGoogleCalendarUrl(webinar: Webinar, durationMinutes = 60) {
  const start = new Date(webinar.dateTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const dates = `${toUTCString(start)}/${toUTCString(end)}`;
  const text = encodeURIComponent(webinar.title);
  const details = encodeURIComponent(webinar.subtitle || '');
  const location = encodeURIComponent(webinar.meetUrl || 'Online');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${dates}&text=${text}&details=${details}&location=${location}`;
}

export function buildICS(webinar: Webinar, durationMinutes = 60) {
  const start = new Date(webinar.dateTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const uid = `${webinar.id}@webinarhub`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WebinarHub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toUTCString(new Date())}`,
    `DTSTART:${toUTCString(start)}`,
    `DTEND:${toUTCString(end)}`,
    `SUMMARY:${webinar.title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(webinar.subtitle || '').replace(/\n/g, ' ')}`,
    `LOCATION:${(webinar.meetUrl || 'Online').replace(/\n/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return lines.join('\r\n');
}

export function downloadICS(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function extractUrls(...texts: (string | null | undefined)[]) {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const set = new Set<string>();
  for (const t of texts) {
    if (!t) continue;
    const matches = t.match(urlRegex);
    matches?.forEach((u) => set.add(u));
  }
  return Array.from(set.values());
}
