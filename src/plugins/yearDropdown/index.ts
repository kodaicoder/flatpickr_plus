import { Plugin } from "../../types/options";
import { Instance } from "../../types/instance";

export interface Config {
  selectYear: number;
  yearStart: number;
  yearEnd: number;
}

const defaultConfig: Config = {
  selectYear: new Date().getFullYear(),
  yearStart: 1900,
  yearEnd: new Date().getFullYear(),
};

function yearDropdownPlugin(pluginConfig?: Partial<Config>): Plugin {
  const config = { ...defaultConfig, ...pluginConfig };
  const initialYear = config.selectYear;

  return (fp: Instance) => {
    const self = {
      yearSelectContainer: null as null | HTMLDivElement,
      yearSelect: null as null | HTMLSelectElement,
    };

    const createSelectElement = function (initialYear: number) {
      const start = config.yearStart;
      const end = config.yearEnd;
      self.yearSelect = fp._createElement<HTMLSelectElement>(
        "select",
        "flatpickr-monthDropdown-months"
      );

      self.yearSelect.setAttribute("aria-label", "year selection");
      let minYearOpt;
      let maxYearOpt;
      if (fp.config._minDate && fp.config._maxDate) {
        minYearOpt = new Date(fp.config._minDate).getFullYear();
        maxYearOpt = new Date(fp.config._maxDate).getFullYear();
      } else {
        minYearOpt = start;
        maxYearOpt = end;
        fp.config._minDate = new Date(start, 0, 1);
        fp.config._maxDate = new Date(end, 11, 31);
      }

      if (fp.config.useLocaleYear) {
        minYearOpt += fp.l10n.localeYearAdjustment;
        maxYearOpt += fp.l10n.localeYearAdjustment;
        initialYear += fp.l10n.localeYearAdjustment;
      }

      for (let i = maxYearOpt; i >= minYearOpt; i--) {
        const year = fp._createElement<HTMLOptionElement>(
          "option",
          "flatpickr-monthDropdown-month"
        );
        year.value = i.toString();
        year.text = i.toString();
        self.yearSelect.appendChild(year);
      }

      self.yearSelect.value = initialYear.toString();

      fp._bind(self.yearSelect, "change", (e) => {
        let year;
        const target = e.target as HTMLSelectElement;
        const selectedYear = target["value"];
        fp.currentYearElement.value = selectedYear;

        if (fp.config.useLocaleYear) {
          year = parseInt(selectedYear) - fp.l10n.localeYearAdjustment;
          fp.currentYear = year;
        } else {
          year = parseInt(selectedYear);
          fp.currentYear = year;
        }
        fp.changeYear(+year);
        fp.redraw();
      });

      fp._bind(self.yearSelect, "reset", () => {
        self.yearSelect!.value = fp.currentYearElement.value;
        fp.redraw();
      });
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
      createSelectElement(initialYear);
      createSelectContainer();
      fp.yearSelect = self.yearSelect;
      fp.yearSelectContainer = self.yearSelectContainer;
    };

    const hideOldYearInput = () => {
      const flatpickrYearElement = fp.currentYearElement;
      flatpickrYearElement.parentElement!.classList.add("flatpickr-disabled");
    };

    return {
      onReady: [
        hideOldYearInput,
        buildSelect,
        () => {
          const flatpickrYearElement = fp.currentYearElement;
          flatpickrYearElement.parentElement!.parentElement!.appendChild(
            fp.yearSelectContainer!
          );
        },
      ],
      onYearChange: function onYearChange() {
        const yearSelect = fp.yearSelect!;
        let year = fp.currentYear;
        if (fp.config.useLocaleYear) {
          year += fp.l10n.localeYearAdjustment;
        }
        yearSelect.value = year.toString();
      },
    };
  };
}

export default yearDropdownPlugin;
