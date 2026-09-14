import { getAdelaideTimezoneOffset } from "./timezone.ts";

interface PreviewShift {
  show_start: string | Date;
  arrive_time: string | Date;
  show_name: string;
  role: string;
}

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]!));

/** Include every vacancy on the next ten distinct Adelaide performance dates. */
export function buildLastMinutePreview(shifts: PreviewShift[]): string[] {
  const timeZone = getAdelaideTimezoneOffset();
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateLabel = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeLabel = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const days = new Map<string, { date: Date; shifts: PreviewShift[] }>();
  const sorted = [...shifts].sort((a, b) =>
    +new Date(a.show_start) - +new Date(b.show_start) ||
    +new Date(a.arrive_time) - +new Date(b.arrive_time)
  );
  for (const shift of sorted) {
    const date = new Date(shift.show_start);
    const key = dateKey.format(date);
    if (!days.has(key)) {
      if (days.size === 10) break;
      days.set(key, { date, shifts: [] });
    }
    days.get(key)!.shifts.push(shift);
  }
  return [...days.values()].map((day) =>
    `<strong>${dateLabel.format(day.date)}</strong><br>${
      day.shifts.map((shift) =>
        `${timeLabel.format(new Date(shift.arrive_time))} — ${
          escape(shift.show_name)
        } (${escape(shift.role)})`
      ).join("<br>")
    }`
  );
}
