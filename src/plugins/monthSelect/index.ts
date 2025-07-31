import { Plugin } from "../../types/options";
import { Instance, DayElement } from "../../types/instance";
import { monthToStr } from "../../utils/formatting";
import { clearNode, getEventTarget } from "../../utils/dom";

export interface Config {
  shorthand: boolean;
  dateFormat: string;
  altFormat: string;
  theme: string;
  _stubbedCurrentMonth?: number;
  yearPicker?: boolean; // to support yearPicker
}

export interface ElementDate extends Element {
  dateObj: Date;
}

export type MonthElement = HTMLSpanElement & { dateObj: Date; $i: number };

const defaultConfig: Config = {
  shorthand: false,
  dateFormat: "F Y",
  altFormat: "F Y",
  theme: "light",
  yearPicker: false, // to support yearPicker
};

function monthSelectPlugin(pluginConfig?: Partial<Config>): Plugin {
  const config = { ...defaultConfig, ...pluginConfig };

  return (fp: Instance) => {
    fp.config.dateFormat = config.dateFormat;
    fp.config.altFormat = config.altFormat;
    const self = { monthsContainer: null as null | HTMLDivElement };

    function clearUnnecessaryDOMElements(): void {
      if (!fp.rContainer) return;

      clearNode(fp.rContainer);

      for (let index = 0; index < fp.monthElements.length; index++) {
        const element = fp.monthElements[index];
        if (!element.parentNode) continue;

        element.parentNode.removeChild(element);
      }
    }

    function build() {
      if (!fp.rContainer) return;

      self.monthsContainer = fp._createElement<HTMLDivElement>(
        "div",
        "flatpickr-monthSelect-months"
      );

      self.monthsContainer.tabIndex = -1;

      buildMonths();

      if (!config.yearPicker) {
        fp.rContainer.appendChild(self.monthsContainer);
      }

      //?remove cause we will using master flatpickr style to control the theme
      //?btw we still need to override some of the theme for the monthSelect then we need to using style.css too
      // fp.calendarContainer.classList.add(
      //   `flatpickr-monthSelect-theme-${config.theme}`
      // );
    }

    function buildMonths() {
      if (!self.monthsContainer) return;

      clearNode(self.monthsContainer);

      const frag = document.createDocumentFragment();

      for (let i = 0; i < 12; i++) {
        const month = fp.createDay(
          "flatpickr-day",
          new Date(fp.currentYear, i),
          0,
          i
        );
        if (
          month.dateObj.getMonth() === new Date().getMonth() &&
          month.dateObj.getFullYear() === new Date().getFullYear()
        )
          month.classList.add("today");
        month.textContent = monthToStr(i, config.shorthand, fp.l10n);
        month.addEventListener("click", selectMonth);
        frag.appendChild(month);
      }

      self.monthsContainer.appendChild(frag);
      if (
        fp.config.minDate &&
        fp.currentYear === fp.config.minDate.getFullYear()
      )
        fp.prevMonthNav.classList.add("flatpickr-disabled");
      else fp.prevMonthNav.classList.remove("flatpickr-disabled");

      if (
        fp.config.maxDate &&
        fp.currentYear === fp.config.maxDate.getFullYear()
      )
        fp.nextMonthNav.classList.add("flatpickr-disabled");
      else fp.nextMonthNav.classList.remove("flatpickr-disabled");

      //set year select to selected year
      if (!!fp.yearSelect) {
        let year;
        if (fp.config.useLocaleYear) {
          year = fp.currentYear + fp.l10n.localeYearAdjustment;
        } else {
          year = fp.currentYear;
        }
        fp.yearSelect.value = String(year);
      }
    }

    function bindEvents() {
      fp._bind(fp.prevMonthNav, "click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        fp.changeYear(fp.currentYear - 1);
        selectYear();
        buildMonths();
      });

      fp._bind(fp.nextMonthNav, "click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        fp.changeYear(fp.currentYear + 1);
        selectYear();
        buildMonths();
      });

      fp._bind(
        self.monthsContainer as HTMLElement,
        "mouseover",
        (e: MouseEvent) => {
          if (fp.config.mode === "range")
            fp.onMouseOver(getEventTarget(e) as DayElement, "flatpickr-day");
        }
      );

      //bind with YearDropdown
      if (!!fp.yearSelect) {
        fp._bind(fp.yearSelect, "change", () => {
          selectYear();
          buildMonths();
        });
      }
    }

    function setCurrentlySelected() {
      if (!fp.rContainer) return;
      if (!fp.selectedDates.length) {
        const selectedMonth: ElementDate | null = fp.rContainer.querySelector(
          `.flatpickr-day.selected`
        );
        if (selectedMonth) {
          selectedMonth.classList.remove("selected");
        }
        // const todayMonth: ElementDate | null = fp.rContainer.querySelector(
        //   `.flatpickr-day.today`
        // );
        // if (todayMonth) {
        //   todayMonth.classList.add("selected");
        // }
        return;
      }

      const currentlySelected = fp.rContainer.querySelectorAll(
        ".flatpickr-day.selected"
      );

      for (let index = 0; index < currentlySelected.length; index++) {
        currentlySelected[index].classList.remove("selected");
      }

      for (let i = 0; i < fp.selectedDates.length; i++) {
        const targetMonth = fp.selectedDates[i].getMonth();
        const month: ElementDate | null = fp.rContainer.querySelector(
          `.flatpickr-day:nth-child(${targetMonth + 1})`
        );

        if (month) {
          const isSameDate =
            month.dateObj.getFullYear() === fp.selectedDates[i].getFullYear() &&
            month.dateObj.getMonth() === fp.selectedDates[i].getMonth();
          if (isSameDate) {
            month.classList.add("selected");
          }
        }
      }
    }

    function selectYear() {
      let selectedDate = fp.selectedDates[0];
      if (selectedDate) {
        selectedDate = new Date(selectedDate);
        selectedDate.setFullYear(fp.currentYear);
        if (fp.config.minDate && selectedDate < fp.config.minDate) {
          selectedDate = fp.config.minDate;
        }
        if (fp.config.maxDate && selectedDate > fp.config.maxDate) {
          selectedDate = fp.config.maxDate;
        }
        fp.currentYear = selectedDate.getFullYear();
      }
      //? config to support a locale year adjustment
      if (fp.config.useLocaleYear) {
        fp.currentYearElement.value = String(
          fp.currentYear + fp.l10n.localeYearAdjustment
        );
      } else {
        fp.currentYearElement.value = String(fp.currentYear);
      }

      if (fp.rContainer) {
        const months: NodeListOf<ElementDate> = fp.rContainer.querySelectorAll(
          ".flatpickr-day"
        );
        months.forEach((month) => {
          month.dateObj.setFullYear(fp.currentYear);
          if (
            (fp.config.minDate && month.dateObj < fp.config.minDate) ||
            (fp.config.maxDate && month.dateObj > fp.config.maxDate)
          ) {
            month.classList.add("flatpickr-disabled");
          } else {
            month.classList.remove("flatpickr-disabled");
          }
        });
      }
      setCurrentlySelected();
    }

    function selectMonth(e: Event) {
      e.preventDefault();
      e.stopPropagation();

      const eventTarget = getEventTarget(e);

      if (!(eventTarget instanceof Element)) return;
      if (eventTarget.classList.contains("flatpickr-disabled")) return;
      if (eventTarget.classList.contains("notAllowed")) return; // necessary??

      const selectDateObj = (eventTarget as MonthElement).dateObj;
      if (fp.config.mode === "range") {
        if (fp.selectedDates.length === 2) {
          fp.clear(false, false);
        }
        setMonth(selectDateObj);
      } else {
        if (fp.selectedDates.length > 0) {
          let isContain = false;
          for (let i = 0; i < fp.selectedDates.length; i++) {
            if (
              fp.selectedDates[i].getMonth() == selectDateObj.getMonth() &&
              fp.selectedDates[i].getFullYear() == selectDateObj.getFullYear()
            ) {
              isContain = true;
              break;
            }
          }
          if (isContain) {
            let selectedDate = fp.selectedDates.filter(
              (date) =>
                date.getMonth() != selectDateObj.getMonth() ||
                date.getFullYear() != selectDateObj.getFullYear()
            );
            fp.setDate(selectedDate, true);
          } else {
            setMonth(selectDateObj);
          }
        } else {
          setMonth(selectDateObj);
        }
      }

      if (fp.config.closeOnSelect) {
        const single = fp.config.mode === "single";
        const range =
          fp.config.mode === "range" && fp.selectedDates.length === 2;

        if (single || range) fp.close();
      }
    }

    function setMonth(date: Date) {
      const selectedDate = new Date(
        fp.currentYear,
        date.getMonth(),
        date.getDate()
      );
      let selectedDates: Date[] = [...fp.selectedDates];

      switch (fp.config.mode) {
        case "single":
          selectedDates = [selectedDate];
          break;

        case "multiple":
          selectedDates.push(selectedDate);
          break;

        case "range":
          if (fp.selectedDates.length === 2) {
            selectedDates = [selectedDate];
          } else {
            selectedDates = fp.selectedDates.concat([selectedDate]);
            selectedDates.sort((a, b) => a.getTime() - b.getTime());
          }

          break;
      }

      fp.setDate(selectedDates, true);
      setCurrentlySelected();
    }

    const shifts: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowDown: 3,
      ArrowUp: -3,
    };

    function onKeyDown(_: any, __: any, ___: any, e: KeyboardEvent) {
      const shouldMove = shifts[e.key] !== undefined;
      if (!shouldMove && e.key !== "Enter") {
        return;
      }
      if (!fp.rContainer || !self.monthsContainer) return;
      const currentlySelected = fp.rContainer.querySelector(
        ".flatpickr-day.selected"
      ) as HTMLElement;
      let index = Array.prototype.indexOf.call(
        self.monthsContainer.children,
        document.activeElement
      );
      if (index === -1) {
        const target =
          currentlySelected || self.monthsContainer.firstElementChild;
        target.focus();
        index = (target as MonthElement).$i;
      }
      if (shouldMove) {
        if (index + shifts[e.key] > 11) {
          fp.changeYear(fp.currentYear + 1);
          buildMonths();
        }
        if (index + shifts[e.key] < 0) {
          fp.changeYear(fp.currentYear - 1);
          buildMonths();
        }
        (self.monthsContainer.children[
          (12 + index + shifts[e.key]) % 12
        ] as HTMLElement).focus();
      } else if (
        e.key === "Enter" &&
        self.monthsContainer.contains(document.activeElement)
      ) {
        setMonth((document.activeElement as MonthElement).dateObj);
      }
    }

    function closeHook() {
      if (fp.config?.mode === "range" && fp.selectedDates.length === 1)
        fp.clear(false);

      if (
        (fp.config?.mode === "single" || fp.config?.mode === "multiple") &&
        fp.selectedDates.length === 0
      )
        fp.clear(false, false);

      if (!fp.selectedDates.length) buildMonths();
    }

    // Help the prev/next year nav honor config.minDate (see 3fa5a69)
    function stubCurrentMonth() {
      config._stubbedCurrentMonth = fp._initialDate.getMonth();

      fp._initialDate.setMonth(config._stubbedCurrentMonth);
      fp.currentMonth = config._stubbedCurrentMonth;
    }

    function unstubCurrentMonth() {
      if (!config._stubbedCurrentMonth) return;

      fp._initialDate.setMonth(config._stubbedCurrentMonth);
      fp.currentMonth = config._stubbedCurrentMonth;
      delete config._stubbedCurrentMonth;
    }

    function destroyPluginInstance() {
      if (self.monthsContainer !== null) {
        const months = self.monthsContainer.querySelectorAll(".flatpickr-day");

        for (let index = 0; index < months.length; index++) {
          months[index].removeEventListener("click", selectMonth);
        }
      }
    }

    function onMonthOpen() {
      let currentlySelected;
      if (!fp.config.defaultDate) {
        currentlySelected = fp.rContainer?.querySelector(
          ".flatpickr-day.today"
        ) as HTMLElement;
      } else {
        currentlySelected = fp.rContainer?.querySelector(
          ".flatpickr-day.selected"
        ) as HTMLElement;
      }

      currentlySelected && currentlySelected.focus();
    }

    return {
      onParseConfig() {
        fp.config.enableTime = false;
      },
      onValueUpdate: setCurrentlySelected,
      onOpen: [onMonthOpen],
      onKeyDown,
      onReady: [
        stubCurrentMonth,
        clearUnnecessaryDOMElements,
        build,
        bindEvents,
        setCurrentlySelected,
        () => {
          // fp.config.onClose.push(closeHook);
          fp.loadedPlugins.push("monthSelect");
        },
      ],
      onChange: [
        () => {
          selectYear();
          buildMonths();
          // setCurrentlySelected();
        },
      ],
      onDestroy: [
        unstubCurrentMonth,
        destroyPluginInstance,
        () => {
          fp.config.onClose = fp.config.onClose.filter(
            (hook) => hook !== closeHook
          );
        },
      ],
    };
  };
}

export default monthSelectPlugin;
