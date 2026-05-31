// Утилиты форматирования для отображения данных podcast-core.

const RU_MONTHS_SHORT = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

/** Секунды → "m:ss" или "h:mm:ss". Пустая строка, если длительности нет. */
export const formatClock = (totalSeconds?: number | null): string => {
  if (!totalSeconds || totalSeconds <= 0) {
    return "";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${minutes}:${pad(seconds)}`;
};

/** Секунды → целое число минут (для метрик вида "54 минуты"). */
export const formatMinutes = (totalSeconds?: number | null): number =>
  Math.max(0, Math.round((totalSeconds ?? 0) / 60));

/** ISO-дата → "12 окт 2023". */
export const formatRuDate = (iso?: string | null): string => {
  if (!iso) {
    return "";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getDate()} ${RU_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
};

/** Большие числа → "12,4K" / "1,2M". */
export const formatCompact = (value?: number | null): string => {
  const num = value ?? 0;

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }

  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(".", ",")}K`;
  }

  return num.toString();
};

/** Минуты текстом: "54 минуты". */
export const formatDurationMinutes = (totalSeconds?: number | null): string => {
  const minutes = formatMinutes(totalSeconds);
  return `${minutes} ${pluralizeRu(minutes, ["минута", "минуты", "минут"])}`;
};

/** Русская плюрализация: pluralizeRu(n, ["минута","минуты","минут"]). */
export const pluralizeRu = (
  count: number,
  forms: [one: string, few: string, many: string]
): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }

  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return forms[1];
  }

  return forms[2];
};
