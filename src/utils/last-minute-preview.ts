import { getAdelaideTimezoneOffset } from "./timezone.ts";

interface PreviewShift {
  show_start: string | Date;
  show_end: string | Date;
  show_date_id: number;
  show_name: string;
}

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]!));

/** Summarize each performance once on the next ten distinct Adelaide performance dates. */
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
  const days = new Map<
    string,
    { date: Date; performances: Map<number, PreviewShift> }
  >();
  const sorted = [...shifts].sort((a, b) =>
    +new Date(a.show_start) - +new Date(b.show_start)
  );
  for (const shift of sorted) {
    const date = new Date(shift.show_start);
    const key = dateKey.format(date);
    if (!days.has(key)) {
      if (days.size === 10) break;
      days.set(key, { date, performances: new Map() });
    }
    days.get(key)!.performances.set(shift.show_date_id, shift);
  }
  return [...days.values()].map((day) =>
    `<strong>${dateLabel.format(day.date)}</strong><br>${
      [...day.performances.values()].map((performance) => {
        const start = new Date(performance.show_start);
        const end = new Date(performance.show_end);
        const endDate = dateKey.format(start) === dateKey.format(end)
          ? ""
          : ` (${dateLabel.format(end)})`;
        return `${escape(performance.show_name)} — ${
          timeLabel.format(start)
        } – ${timeLabel.format(end)}${endDate}`;
      }).join("<br>")
    }`
  );
}
