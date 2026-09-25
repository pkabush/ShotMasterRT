import React, {  useMemo, useState } from "react";
import { Form } from "react-bootstrap";

export interface DateSpan {
    startDate: Date;
    endDate: Date;
}

interface WeekPickerProps {
    value?: DateSpan;
    onChange?: (week: DateSpan) => void;
}

const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();

    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    d.setHours(0, 0, 0, 0);

    return d;
};

const getSunday = (monday: Date) => {
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return sunday;
};

export const getCurrentWeekSpan = (): DateSpan => {
  const today = new Date();

  const monday = getMonday(today);
  const sunday = getSunday(monday);

  return {
    startDate: monday,
    endDate: sunday,
  };
};

const formatDate = (date: Date) =>
    date.toLocaleDateString("en-GB", {
        day: "2-digit",
    });

const formatWeek = (monday: Date) => {
    const sunday = getSunday(monday);

    return `${formatDate(monday)} - ${formatDate(sunday)}`;
};

const getWeeksForMonth = (
    year: number,
    month: number,
    today: Date
) => {
    const weeks: Date[] = [];

    let monday = getMonday(new Date(year, month, 1));

    if (monday.getMonth() !== month) {
        monday.setDate(monday.getDate() + 7);
    }

    const currentMonday = getMonday(today);

    while (
        monday.getFullYear() === year &&
        monday.getMonth() === month
    ) {
        if (monday <= currentMonday) {
            weeks.push(new Date(monday));
        }

        monday.setDate(monday.getDate() + 7);
    }

    return weeks;
};

const months = Array.from({ length: 12 }, (_, month) => ({
    value: month,
    label: new Date(2000, month, 1).toLocaleDateString(
        "en-GB",
        { month: "long" }
    ),
}));

const WeekPicker: React.FC<WeekPickerProps> = ({
    value,
    onChange,
}) => {
    const today = new Date();

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentMonday = getMonday(today);

    const years = useMemo(
        () =>
            Array.from(
                { length: 5 },
                (_, index) => currentYear - index
            ),
        [currentYear]
    );

    const [selectedYear, setSelectedYear] =
        useState(currentYear);

    const [selectedMonth, setSelectedMonth] =
        useState(currentMonth);

    const [selectedWeek, setSelectedWeek] =
        useState<Date>(
            value?.startDate ?? currentMonday
        );

    const availableMonths = useMemo(() => {
        if (selectedYear === currentYear) {
            return months.slice(0, currentMonth + 1);
        }

        return months;
    }, [
        selectedYear,
        currentYear,
        currentMonth,
    ]);

    const weeks = useMemo(
        () =>
            getWeeksForMonth(
                selectedYear,
                selectedMonth,
                today
            ),
        [selectedYear, selectedMonth]
    );

    const updateWeek = (monday: Date) => {
        setSelectedWeek(monday);

        onChange?.({
            startDate: new Date(monday),
            endDate: getSunday(monday),
        });
    };

    const handleYearChange = (year: number) => {
        setSelectedYear(year);

        const month =
            year === currentYear
                ? currentMonth
                : 0;

        setSelectedMonth(month);

        const newWeeks = getWeeksForMonth(
            year,
            month,
            today
        );

        if (newWeeks.length > 0) {
            updateWeek(
                newWeeks[newWeeks.length - 1]
            );
        }
    };

    const handleMonthChange = (month: number) => {
        setSelectedMonth(month);

        const newWeeks = getWeeksForMonth(
            selectedYear,
            month,
            today
        );

        if (newWeeks.length > 0) {
            updateWeek(
                newWeeks[newWeeks.length - 1]
            );
        }
    };

    return (
        <div className="d-flex gap-2">
            <Form.Select
                value={selectedYear}
                onChange={(e) =>
                    handleYearChange(
                        Number(e.target.value)
                    )
                }
                style={{ width: "auto" }}
            >
                {years.map((year) => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                ))}
            </Form.Select>

            <Form.Select
                value={selectedMonth}
                onChange={(e) =>
                    handleMonthChange(
                        Number(e.target.value)
                    )
                }
                style={{ width: "auto" }}
            >
                {availableMonths.map((month) => (
                    <option
                        key={month.value}
                        value={month.value}
                    >
                        {month.label}
                    </option>
                ))}
            </Form.Select>

            <Form.Select
                value={selectedWeek.toISOString()}
                onChange={(e) =>
                    updateWeek(
                        new Date(e.target.value)
                    )
                }
                style={{ width: "auto" }}
            >
                {weeks.map((week) => (
                    <option
                        key={week.toISOString()}
                        value={week.toISOString()}
                    >
                        {formatWeek(week)}
                    </option>
                ))}
            </Form.Select>
        </div>
    );
};

export default WeekPicker;