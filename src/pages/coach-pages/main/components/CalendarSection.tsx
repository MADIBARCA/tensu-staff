import React, { useState, useMemo, useEffect } from "react";
import { DayDetailsModal } from "./DayDetailsModal";
import type { DaySchedule, Lesson } from "@/functions/axios/responses";
import { scheduleApi } from "@/functions/axios/axiosFunctions";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";

const coaches = ["Иван Иванов", "Мария Петрова", "Сергей Смирнов"];
const clubs = ["Bars Checkmat", "Titan Fit", "Tigers"];

export const CalendarSection: React.FC<{ token: string | null }> = ({
  token,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<
    Record<string, Array<DaySchedule>>
  >({});
  const [showFilters, setShowFilters] = useState(false);
  const [calendarFilters, setCalendarFilters] = useState({
    coach: "all",
    club: "all",
    type: "all",
  });

  // Compute all week-start dates in the current month
  const getWeeksInMonth = (date: Date) => {
    const weeks: string[] = [];
    const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    // find Monday of first week
    let current = new Date(firstOfMonth);
    const day = current.getDay();
    const diff = (day + 6) % 7; // Monday=0
    current.setDate(current.getDate() - diff);
    while (current <= lastOfMonth) {
      weeks.push(current.toISOString().split("T")[0]);
      current = new Date(current);
      current.setDate(current.getDate() + 7);
    }
    return weeks;
  };

  useEffect(() => {
    const weeks = getWeeksInMonth(currentDate);
    weeks.forEach((dateStr) => {
      scheduleApi
        .getWeekSchedule(dateStr, token!)
        .then((res) => {
          const daysArray = res.data.days;
          setCalendarData((prev) => ({ ...prev, [dateStr]: daysArray }));
        })
        .catch(console.error);
    });
  }, [currentDate, token]);

  // Calendar utilities
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= total; d++) days.push(new Date(year, month, d));
    return days;
  };

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);
  const formatDate = (d: Date) =>
    d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  const navigateMonth = (dir: "prev" | "next") =>
    setCurrentDate((d) => {
      const nd = new Date(d);
      nd.setMonth(nd.getMonth() + (dir === "next" ? 1 : -1));
      return nd;
    });

  // Get scheduled lessons for a date
  const getLessonsForDate = (dateStr: string): Lesson[] => {
    // find week start for this date
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = (day + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    const weekKey = monday.toISOString().split("T")[0];
    const daysArr = calendarData[weekKey] || [];
    const dayEntry = daysArr.find((ws) => ws.schedule_date === dateStr);
    return dayEntry ? dayEntry.lessons : [];
  };

  return (
    <section className="bg-white rounded-lg border border-gray-200 mb-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-gray-900">Расписание</h2>
          <button
            onClick={() => setShowFilters((f) => !f)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Filter size={20} />
          </button>
        </div>

        {showFilters && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тренеры
              </label>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() =>
                    setCalendarFilters((prev) => ({ ...prev, coach: "all" }))
                  }
                  className={`px-2 py-1 text-xs rounded-full ${
                    calendarFilters.coach === "all"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-white text-gray-600 border"
                  }`}
                >
                  Все тренеры
                </button>
                {coaches.map((coach) => (
                  <button
                    key={coach}
                    onClick={() =>
                      setCalendarFilters((prev) => ({ ...prev, coach }))
                    }
                    className={`px-2 py-1 text-xs rounded-full ${
                      calendarFilters.coach === coach
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white text-gray-600 border"
                    }`}
                  >
                    {coach}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Клубы
              </label>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() =>
                    setCalendarFilters((prev) => ({ ...prev, club: "all" }))
                  }
                  className={`px-2 py-1 text-xs rounded-full ${
                    calendarFilters.club === "all"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-white text-gray-600 border"
                  }`}
                >
                  Все клубы
                </button>
                {clubs.map((club) => (
                  <button
                    key={club}
                    onClick={() =>
                      setCalendarFilters((prev) => ({ ...prev, club }))
                    }
                    className={`px-2 py-1 text-xs rounded-full ${
                      calendarFilters.club === club
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white text-gray-600 border"
                    }`}
                  >
                    {club}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-base font-medium capitalize">
            {formatDate(currentDate)}
          </h3>
          <button
            onClick={() => navigateMonth("next")}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        {/* calendar grid */}
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-100 text-gray-500 text-xs font-medium">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
              <div key={d} className="py-2 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, idx) => (
              <div
                key={idx}
                onClick={() =>
                  day && setSelectedDay(day.toISOString().split("T")[0])
                }
                className={`min-h-[60px] p-1 border border-gray-200 cursor-pointer transition-colors ${
                  !day
                    ? "bg-gray-50"
                    : day.toDateString() === new Date().toDateString()
                    ? "bg-blue-50"
                    : "bg-white"
                } hover:bg-gray-100`}
              >
                {day && (
                  <>
                    <div
                      className={`text-xs font-medium mb-1 ${
                        day.toDateString() === new Date().toDateString()
                          ? "text-blue-600"
                          : "text-gray-800"
                      }`}
                    >
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {getLessonsForDate(day.toISOString().split("T")[0])
                        .slice(0, 2)
                        .map((les) => (
                          <div
                            key={les.id}
                            className="text-[10px] text-white rounded px-1 py-0.5 truncate bg-green-500"
                          >
                            {les.planned_start_time.slice(0, 5)}
                          </div>
                        ))}
                      {getLessonsForDate(day.toISOString().split("T")[0])
                        .length > 2 && (
                        <p className="text-[10px] text-gray-500">
                          +
                          {getLessonsForDate(day.toISOString().split("T")[0])
                            .length - 2}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedDay && (
          <DayDetailsModal
            day={selectedDay}
            onClose={() => setSelectedDay(null)}
            trainings={getLessonsForDate(selectedDay)}
            // showEdit
          />
        )}
      </div>
    </section>
  );
};
