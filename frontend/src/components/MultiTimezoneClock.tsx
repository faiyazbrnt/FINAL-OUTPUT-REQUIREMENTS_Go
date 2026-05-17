import { memo, useEffect, useMemo, useState } from "react";

const PH_TIMEZONE = "Asia/Manila";
const DEFAULT_US_TIMEZONE = "America/New_York";

const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true
};

const TIME_WITH_ZONE_OPTIONS: Intl.DateTimeFormatOptions = {
  ...TIME_FORMAT_OPTIONS,
  timeZoneName: "short"
};

const isValidTimeZone = (timeZone: string): boolean => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

const resolveUsTimeZone = (): string => {
  const configuredTimeZone = import.meta.env.VITE_US_TIMEZONE?.trim();
  if (!configuredTimeZone) {
    return DEFAULT_US_TIMEZONE;
  }
  if (isValidTimeZone(configuredTimeZone)) {
    return configuredTimeZone;
  }
  console.warn(`Invalid VITE_US_TIMEZONE value "${configuredTimeZone}". Falling back to ${DEFAULT_US_TIMEZONE}.`);
  return DEFAULT_US_TIMEZONE;
};

const getTimeZoneName = (formatter: Intl.DateTimeFormat, date: Date, fallback: string): string => {
  const zonePart = formatter.formatToParts(date).find((part) => part.type === "timeZoneName")?.value?.trim();
  return zonePart || fallback;
};

const MultiTimezoneClock = (): JSX.Element => {
  const [now, setNow] = useState(() => Date.now());
  const usTimeZone = useMemo(() => resolveUsTimeZone(), []);

  const formatters = useMemo(
    () => ({
      philippines: new Intl.DateTimeFormat("en-US", {
        ...TIME_FORMAT_OPTIONS,
        timeZone: PH_TIMEZONE
      }),
      unitedStates: new Intl.DateTimeFormat("en-US", {
        ...TIME_FORMAT_OPTIONS,
        timeZone: usTimeZone
      }),
      unitedStatesZone: new Intl.DateTimeFormat("en-US", {
        ...TIME_WITH_ZONE_OPTIONS,
        timeZone: usTimeZone
      })
    }),
    [usTimeZone]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const currentDate = new Date(now);
  const philippinesTime = formatters.philippines.format(currentDate);
  const unitedStatesTime = formatters.unitedStates.format(currentDate);
  const unitedStatesZone = getTimeZoneName(formatters.unitedStatesZone, currentDate, "US");

  return (
    <div className="multi-timezone-clock" aria-live="off">
      <p className="clock-row">
        <span className="clock-label">Philippines:</span>
        <span className="clock-value">
          {philippinesTime} <span className="clock-zone">PHT</span>
        </span>
      </p>
      <p className="clock-row">
        <span className="clock-label">United States:</span>
        <span className="clock-value">
          {unitedStatesTime} <span className="clock-zone">{unitedStatesZone}</span>
        </span>
      </p>
    </div>
  );
};

export default memo(MultiTimezoneClock);
