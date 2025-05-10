declare module 'flowbite-datepicker/Datepicker' {
  interface DatepickerOptions {
    container?: string;
    language?: string;
    labelToday?: string;
    labelClear?: string;
    locales?: Record<string, any>;
    todayBtnMode?: number;
    todayBtn?: boolean;
    clearBtn?: boolean;
    autohide?: boolean;
    clearFieldAction?: () => void;
    format?: string;
  }

  interface Datepicker {
    locales: Record<string, any>;
    hide: () => void;
    new (element: HTMLElement | null, options: DatepickerOptions): Datepicker;
  }

  const Datepicker: Datepicker;
  export default Datepicker;
}

declare module 'flowbite-datepicker/DateRangePicker' {
  interface DateRangePickerOptions {
    inputs?: HTMLElement[];
    container?: string;
    language?: string;
    locales?: Record<string, any>;
    Mode?: number;
    todayBtnMode?: number;
    todayBtn?: boolean;
    clearBtn?: boolean;
    autohide?: boolean;
    format?: string;
  }

  interface DateRangePicker {
    hide: () => void;
    setDates: (from: string | { clear: boolean }, to: string | { clear: boolean }) => void;
    new (element: HTMLElement | null, options: DateRangePickerOptions): DateRangePicker;
  }

  const DateRangePicker: DateRangePicker;
  export default DateRangePicker;
} 