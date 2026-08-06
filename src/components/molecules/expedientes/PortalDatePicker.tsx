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

interface PortalDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disableBeforeToday?: boolean;
  placeholder?: string;
}

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
  placeholder = "Seleccioná una fecha",
}: PortalDatePickerProps) {
  const parsedValue = value ? parseDate(value) : null;
  const display = value ? formatDisplay(value) : null;

  return (
    <I18nProvider locale="es-AR">
      <DatePickerRoot
        value={parsedValue}
        onChange={(date) => onChange(date ? date.toString() : "")}
        onBlur={onBlur}
        minValue={disableBeforeToday ? today(getLocalTimeZone()) : undefined}
        className="w-full"
      >
        <Group className="block w-full">
          <DatePickerTrigger className="w-full justify-between rounded-2xl border border-[#ddd6eb] bg-white px-4 py-3 text-left text-sm text-[#2f3042] transition focus:border-[#8f63d9]">
            <span className={display ? undefined : "text-[#8f7fa0]"}>
              {display ?? placeholder}
            </span>
            <DatePickerTriggerIndicator>
              <CalendarDays size={16} className="text-[#8f63d9]" />
            </DatePickerTriggerIndicator>
          </DatePickerTrigger>
        </Group>

        <DatePickerPopover placement="bottom">
          <Dialog className="outline-none">
            <CalendarRoot>
              <CalendarHeader>
                <CalendarNavButton
                  slot="previous"
                  className="text-[#8f63d9] data-[hovered=true]:bg-[#f0e9fb]"
                />
                <CalendarHeading className="text-[#2f3042]" />
                <CalendarNavButton
                  slot="next"
                  className="text-[#8f63d9] data-[hovered=true]:bg-[#f0e9fb]"
                />
              </CalendarHeader>
              <CalendarGrid weekdayStyle="short">
                <CalendarGridHeader>
                  {(day) => (
                    <CalendarHeaderCell className="text-[#8f7fa0]">
                      {day}
                    </CalendarHeaderCell>
                  )}
                </CalendarGridHeader>
                <CalendarGridBody>
                  {(date) => (
                    <CalendarCell
                      date={date}
                      className="text-[#2f3042] data-[today=true]:bg-[#8f63d9] data-[today=true]:text-white data-[selected=true]:bg-[#8f63d9] data-[selected=true]:text-white data-[outside-month=true]:text-[#c7c7cf] data-[disabled=true]:text-[#d4d4d8]"
                    />
                  )}
                </CalendarGridBody>
              </CalendarGrid>
            </CalendarRoot>
          </Dialog>
        </DatePickerPopover>
      </DatePickerRoot>
    </I18nProvider>
  );
}
