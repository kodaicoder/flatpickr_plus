import { Plugin } from "../../types/options";
import { Instance } from "../../types/instance";

export interface Config {
  selectYear: number;
}

const defaultConfig: Config = {
  selectYear: new Date().getFullYear(), //default to next year
};

function yearDropdownPlugin(pluginConfig?: Partial<Config>): Plugin {
  const config = { ...defaultConfig, ...pluginConfig };
  let initialYear = config.selectYear;

  return (fp: Instance) => {
    const self = {
      yearSelectContainer: null as null | HTMLDivElement,
      yearSelect: null as null | HTMLSelectElement,
    };

    const hideOldYearInput = () => {
      const flatpickrYearElement = fp.currentYearElement;
      flatpickrYearElement.parentElement!.classList.add("flatpickr-disabled");
    };

    const setDefaultMinMaxDate = () => {
      //set min date to last day of current year - 150
      if (!fp.config.minDate) {
        fp.config.minDate = new Date(new Date().getFullYear() - 150, 0, 1);
      }
      //set max date to last day of current year
      if (!fp.config.maxDate) {
        fp.config.maxDate = new Date(new Date().getFullYear(), 11, 31);
      }
    };

    const createSelectElement = function (initialYear: number) {
      let start = fp.config.minDate!.getFullYear();
      let end = fp.config.maxDate!.getFullYear();

      self.yearSelect = fp._createElement<HTMLSelectElement>(
        "select",
        "flatpickr-monthDropdown-months"
      );
      self.yearSelect.setAttribute("aria-label", "year selection");
      self.yearSelect.addEventListener("change", onYearSelected);
      self.yearSelect.addEventListener("reset", onReset);

      if (fp.config.useLocaleYear) {
        start += fp.l10n.localeYearAdjustment;
        end += fp.l10n.localeYearAdjustment;
        initialYear += fp.l10n.localeYearAdjustment;
      }

      for (let i = end; i >= start; i--) {
        const year = fp._createElement<HTMLOptionElement>(
          "option",
          "flatpickr-monthDropdown-month"
        );
        year.value = i.toString();
        year.text = i.toString();
        self.yearSelect.appendChild(year);
      }

      self.yearSelect.value =
        initialYear > end ? end.toString() : initialYear.toString();
    };

    const createSelectContainer = () => {
      self.yearSelectContainer = fp._createElement<HTMLDivElement>(
        "div",
        "numInputWrapper"
      );
      self.yearSelectContainer.tabIndex = -1;
      if (!!self.yearSelect) {
        self.yearSelectContainer.appendChild(self.yearSelect);
      }
    };

    const buildSelect = () => {
      initialYear = fp.latestSelectedDateObj
        ? fp.latestSelectedDateObj.getFullYear()
        : initialYear;
      createSelectElement(initialYear);
      createSelectContainer();
      fp.yearSelect = self.yearSelect;
      fp.yearSelectContainer = self.yearSelectContainer;
    };

    const bindEvents = () => {
      if (self.yearSelect !== null) {
        fp._bind(self.yearSelect, "change", onYearSelected);
        fp._bind(self.yearSelect, "reset", onReset);
      }
    };

    const changeYear = () => {
      const yearSelect = fp.yearSelect!;
      let year = fp.currentYear;
      if (fp.config.useLocaleYear) {
        year += fp.l10n.localeYearAdjustment;
      }
      yearSelect.value = year.toString();
    };

    //Events
    const onYearSelected = (e: Event) => {
      let year;
      const target = e.target as HTMLSelectElement;
      const selectedYear = target.value;
      fp.changeYear(+selectedYear);
      // fp.currentYearElement.value = selectedYear;

      if (fp.config.useLocaleYear) {
        year = parseInt(selectedYear) - fp.l10n.localeYearAdjustment;
        fp.currentYear = year;
      } else {
        year = parseInt(selectedYear);
        fp.currentYear = year;
      }

      fp.changeYear(+year);
      fp.redraw();
    };

    const onReset = () => {
      self.yearSelect!.value = fp.currentYearElement.value;
      fp.redraw();
    };

    function destroyPluginInstance() {
      if (self.yearSelect !== null) {
        self.yearSelect.removeEventListener("change", onYearSelected);
        self.yearSelect.removeEventListener("reset", onReset);
      }
    }
    return {
      onReady: [
        setDefaultMinMaxDate,
        hideOldYearInput,
        buildSelect,
        bindEvents,
        () => {
          const flatpickrYearElement = fp.currentYearElement;

          flatpickrYearElement.parentElement!.parentElement!.appendChild(
            fp.yearSelectContainer!
          );
        },
      ],
      onYearChange: changeYear,
      onChange: changeYear,
      onDestroy: [destroyPluginInstance],
    };
  };
}

export default yearDropdownPlugin;
