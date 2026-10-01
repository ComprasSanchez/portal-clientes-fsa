"use client";

import { CalendarDays } from "lucide-react";
import { getLocalTimeZone, parseDate, today } from "@internationalized/date";
import { Dialog, Group, I18nProvider } from "react-aria-components";
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarNavButton,
  CalendarRoot,
  DatePickerPopover,
  DatePickerRoot,
  DatePickerTrigger,
  DatePickerTriggerIndicator,
} from "@heroui/react";

type PortalDatePickerTone = "cora" | "socios";

interface PortalDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disableBeforeToday?: boolean;
  /** YYYY-MM-DD. Fecha mínima seleccionable. */
  minValue?: string;
  /** YYYY-MM-DD. Fecha máxima seleccionable. */
  maxValue?: string;
  placeholder?: string;
  tone?: PortalDatePickerTone;
  "aria-label"?: string;
}

const toneClasses: Record<
  PortalDatePickerTone,
  { trigger: string; placeholder: string; icon: string; nav: string; text: string; header: string; cell: string }
> = {
  cora: {
    trigger:
      "border-[#ddd6eb] text-[#2f3042] focus:border-[#8f63d9]",
    placeholder: "text-[#8f7fa0]",
    icon: "text-[#8f63d9]",
    nav: "text-[#8f63d9] data-[hovered=true]:bg-[#f0e9fb]",
    text: "text-[#2f3042]",
    header: "text-[#8f7fa0]",
    cell: "text-[#2f3042] data-[today=true]:bg-[#8f63d9] data-[today=true]:text-white data-[selected=true]:bg-[#8f63d9] data-[selected=true]:text-white data-[outside-month=true]:text-[#c7c7cf] data-[disabled=true]:text-[#d4d4d8]",
  },
  socios: {
    trigger:
      "border-[#d5e4e8] text-[#17343d] focus:border-[#007c98]",
    placeholder: "text-[#698088]",
    icon: "text-[#007c98]",
    nav: "text-[#007c98] data-[hovered=true]:bg-[#e6f7fb]",
    text: "text-[#17343d]",
    header: "text-[#698088]",
    cell: "text-[#17343d] data-[today=true]:bg-[#e6f7fb] data-[today=true]:text-[#007c98] data-[selected=true]:bg-[#007c98] data-[selected=true]:text-white data-[outside-month=true]:text-[#c7d3d6] data-[disabled=true]:text-[#d4dcde]",
  },
};

const formatDisplay = (value: string): string | null => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return null;
  return `${day}/${month}/${year}`;
};

export function PortalDatePicker({
  value,
  onChange,
  onBlur,
  disableBeforeToday,
  minValue,
  maxValue,
  placeholder = "Seleccioná una fecha",
  tone = "cora",
  "aria-label": ariaLabel,
}: PortalDatePickerProps) {
  const parsedValue = value ? parseDate(value) : null;
  const display = value ? formatDisplay(value) : null;
  const classes = toneClasses[tone];

  const min = minValue
    ? parseDate(minValue)
    : disableBeforeToday
      ? today(getLocalTimeZone())
      : undefined;
  const max = maxValue ? parseDate(maxValue) : undefined;

  return (
    <I18nProvider locale="es-AR">
      <DatePickerRoot
        value={parsedValue}
        onChange={(date) => onChange(date ? date.toString() : "")}
        onBlur={onBlur}
        minValue={min}
        maxValue={max}
        aria-label={ariaLabel}
        className="w-full"
      >
        <Group className="block w-full">
          <DatePickerTrigger
            className={`w-full justify-between rounded-2xl border bg-white px-4 py-3 text-left text-sm transition ${classes.trigger}`}
          >
            <span className={display ? undefined : classes.placeholder}>
              {display ?? placeholder}
            </span>
            <DatePickerTriggerIndicator>
              <CalendarDays size={16} className={classes.icon} />
            </DatePickerTriggerIndicator>
          </DatePickerTrigger>
        </Group>

        <DatePickerPopover placement="bottom">
          <Dialog className="outline-none">
            <CalendarRoot>
              <CalendarHeader>
                <CalendarNavButton slot="previous" className={classes.nav} />
                <CalendarHeading className={classes.text} />
                <CalendarNavButton slot="next" className={classes.nav} />
              </CalendarHeader>
              <CalendarGrid weekdayStyle="short">
                <CalendarGridHeader>
                  {(day) => (
                    <CalendarHeaderCell className={classes.header}>
                      {day}
                    </CalendarHeaderCell>
                  )}
                </CalendarGridHeader>
                <CalendarGridBody>
                  {(date) => <CalendarCell date={date} className={classes.cell} />}
                </CalendarGridBody>
              </CalendarGrid>
            </CalendarRoot>
          </Dialog>
        </DatePickerPopover>
      </DatePickerRoot>
    </I18nProvider>
  );
}
