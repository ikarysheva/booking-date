import { animate, state, style, transition, trigger } from '@angular/animations';
import {
    AfterContentInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild
} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { CustomDateAdapter } from '../../../shared/custom-date-adapter';
import {DateAdapter} from "@angular/material";

@Component({
    selector: 'app-booking-calendar-week-view',
    templateUrl: './booking-calendar-week-view.component.html',
    styleUrls: ['./booking-calendar-week-view.component.scss'],
    animations: [
        trigger('calendarState', [
            state('open', style({
                transform: 'scale(1) translateY(0)'
            })),
            state('close', style({
                transform: 'scale(1) translateY(-100%)'
            })),
            transition('close <=> open', animate('300ms'))
        ]),
        trigger('calendarState2', [
            state('open', style({
                transform: 'scale(1) translateY(0)'
            })),
            state('close', style({
                transform: 'scale(1) translateY(100%)'
            })),
            transition('close <=> open', animate('300ms'))
        ]),
        trigger('weekState', [
            state('open', style({
                height: '*',
                visibility: 'visible'
            })),
            state('close', style({
                height: 0,
                visibility: 'hidden'
            })),
            transition('close <=> open', animate(300))
            // transition('open => close', style({
            //     opacity: 1
            // }), animate(1800)))
            // transition('open => *', [
            //     style({transform: 'translateY(0) scale(1)'}),
            //     animate(200)
            // ]),
        ])
    ]

})

export class BookingCalendarWeekViewComponent implements OnInit, AfterContentInit, OnDestroy {


  @ViewChild('weekRow')
    weekRowElement: ElementRef;

    @ViewChild('daysRow')
    daysRowElement: ElementRef;

    @Input() range: number;
    @Input() dateFilter: (date: Date) => boolean;
    @Output() selectedChange = new Subject<Date>();
    months: { [month: number]: CalendarCell[][] } = {};
    opened = false;
    numCols: number;
    columns: any[];
    monthLabel: string;
    weekdays: { long: string; narrow: string, short: string }[];
    calendarState = 'close';
    weekState = 'open';
    currentWeek: CalendarCell[];
    prevEnabled = false;
    nextEnabled = true;
    activeDateChange = new EventEmitter();
    private _selectedDate: number;
    private _todayDate: number;
    private _todayMonth: number;
    private _todayRow: number;
    private _selectedMonth: number;
    private _oldRow: number;
    private _oldMonth: number;
    private activeDateSubscription: any;
    private _initialized = false;

    constructor(private _dateAdapter: DateAdapter<any>) {
    }

    private _currentMonth: number;

    get currentMonth(): number {
        return this._currentMonth;
    }

    set currentMonth(value: number) {
        this._currentMonth = value;
        this._setMonthLabel();
    }

    private _currentRow = 1;

    get currentRow(): number {
        return this._currentRow;
    }

    set currentRow(value: number) {
        this._currentRow = value;
        this._updateCurrentWeek();
    }

    private _activeDate: Date;

    get activeDate() {
        return this._activeDate;
    }

    @Input()
    set activeDate(value) {
        this._activeDate = value;
        this.activeDateChange.next();
    }

    private _selected: Date;


    get selected() {
        return this._selected;
    }

    @Input()
    set selected(value) {
        this._selected = value;
        if (this._initialized && this._selected && this._activeDate) {
            this._init();
        }
    }

    ngOnInit() {

        const firstDayOfWeek = this._dateAdapter.getFirstDayOfWeek();
        const narrowWeekdays = this._dateAdapter.getDayOfWeekNames('narrow');
        const longWeekdays = this._dateAdapter.getDayOfWeekNames('long');
        const shortWeekdays = this._dateAdapter.getDayOfWeekNames('short');
        // Rotate the labels for days of the week based on the configured first day of the week.
        const weekdays = longWeekdays.map((long, i) => {
            return {long, narrow: narrowWeekdays[i], short: shortWeekdays[i]};
        });

        if (this.selected) {
            this._selectedDate = this._dateAdapter.getDate(this.selected);
            this._selectedMonth = this._dateAdapter.getMonth(this.selected);
        }

        this.weekdays = weekdays.slice(firstDayOfWeek).concat(weekdays.slice(0, firstDayOfWeek));

        this.numCols = DAYS_PER_WEEK;
        this.columns = [];
        this.columns.length = 7;
    }

    ngAfterContentInit() {
        if (this._activeDate) {
            this._init();
        } else {
            this.activeDateSubscription = this.activeDateChange.subscribe(() => this._init());
        }
    }


    ngOnDestroy(): void {
        if (this.activeDateSubscription) {
            this.activeDateSubscription.unsubscribe();
        }

    }

    cellClicked(cell: CalendarCell) {
        if (this.getCellDisabled(cell)) {
            return;
        }
        if (this._selectedDate === cell.value) {
            return;
        }
        this._selectedDate = cell.value;
        this._selectedMonth = cell.month;
        this._dateSelected(cell.date);
    }

    toggleCalendar() {
        if (!this.opened) {
            this.opened = true;
            this._checkNavButtonsEnabled();
            this._oldMonth = this._currentMonth;
            this._oldRow = this._currentRow;
        } else {
            this._onCalendarClose();
            setTimeout(() => {

                this.opened = false;
                this._checkNavButtonsEnabled();
            }, 310);
        }
        setTimeout(() => {
            this.calendarState = this.calendarState === 'close' ? 'open' : 'close';
            this.weekState = this.calendarState === 'close' || this._currentRow === 0 ? 'open' : 'close';
        }, 10);

    }

    onPrevButtonClick(event) {
        if (!this.opened) {
            this.currentRow--;
        } else {
            this.currentMonth--;
        }
        this._checkNavButtonsEnabled();

    }

    onNextButtonClick(event) {
        if (!this.opened) {
            this.currentRow++;
        } else {
            this.currentMonth++;
        }
        this._checkNavButtonsEnabled();
    }

    getDateInCurrentMonth(date: Date): boolean {
        return this._dateAdapter.getMonth(date) === this.currentMonth;
    }

    getCellDisabled(item: CalendarCell): boolean {
        return !item.enabled || (this.opened && item.month !== this.currentMonth);
    }

    getCellSelected(item: CalendarCell) {
        return item.value === this._selectedDate && item.month === this._selectedMonth;
    }

    getCellToday(item: CalendarCell) {
        return item.value === this._todayDate && item.month === this._todayMonth;
    }

    getRowHeight(row: ElementRef): number {
        return row.nativeElement.offsetHeight;
    }


    private _init(): void {
      this._initialized = true;
        this._selectedDate = this.selected ? this._dateAdapter.getDate(this.selected) : null;
        this._selectedMonth = this.selected ? this._dateAdapter.getMonth(this.selected) : null;

        const today = this._dateAdapter.today();
        this._todayDate = this._dateAdapter.getDate(today);
        this._todayMonth = this._dateAdapter.getMonth(today);

        let count = -1;
        let month: Date;
        while (count <= this.range) {
            month = this._dateAdapter.addCalendarMonths(today, count);
            this.months[month.getMonth()] = this._createWeekCells(month);
            count++;
        }

        this._currentMonth = this._activeDate.getMonth();
        this._todayRow = this._getDateWeekIndex(today);
        this.currentMonth = this._dateAdapter.getMonth(this.selected || this.activeDate);

        this.currentRow = this._getDateWeekIndex(this.selected || this.activeDate);
        this._checkNavButtonsEnabled();
    }

    private _setMonthLabel() {
        this.monthLabel = this._dateAdapter.getMonthNames('long')[this._currentMonth]
            .toLocaleUpperCase();
    }

    private _updateCurrentWeek() {
        const isNextMonth = this._currentRow === this.months[this._currentMonth].length;
        const isPrevMonth = this._currentRow < 0;

        const isLastEnabledMonth = this._currentMonth === this._getLastEnabledMonth();
        const isCurrentRowLastInMonth = this._currentRow === this.months[this._currentMonth].length - 1;
        const isCurrentRowFirstInMonth = this._currentRow === 0;

        let currentWeek = !isNextMonth && !isPrevMonth ? this.months[this._currentMonth][this._currentRow].concat() : null;
        const selectedInWeek = currentWeek && this.selected && this._isDateBelongWeek(currentWeek);
        const isLastWeekFull = currentWeek && currentWeek[currentWeek.length - 1].month === this._currentMonth;
        const isFirstWeekFull = currentWeek && currentWeek[0].month === this._currentMonth;

        const isCurrentMonthToday = this._currentMonth === this._todayMonth;

        if (!isLastEnabledMonth && (isNextMonth || (isCurrentRowLastInMonth && !isLastWeekFull && !selectedInWeek))) {
            this._currentRow = isNextMonth ? 1 : 0;
            this.currentMonth++;
        } else if (!isCurrentMonthToday && isPrevMonth) {
            this.currentMonth--;
            this._currentRow = this.months[this._currentMonth].length - 2;
        }
        currentWeek = this.months[this._currentMonth][this._currentRow].concat();
        this.currentWeek = currentWeek;
        this._checkNavButtonsEnabled();
    }

    private _createWeekCells(month: Date) {

        const daysInMonth = this._dateAdapter.getNumDaysInMonth(month);
        const dateNames = this._dateAdapter.getDateNames();
        const monthIndex = this._dateAdapter.getMonth(month);
        const shortMonthName = this._dateAdapter.getMonthNames('short')[monthIndex];
        const weeks = [[]];
        const firstWeekOffset = this._getFirstWeekOffset(month);

        for (let i = 0, cell = firstWeekOffset; i < daysInMonth; i++, cell++) {
            if (cell === DAYS_PER_WEEK) {
                weeks.push([]);
                cell = 0;
            }
            const date = this._dateAdapter.createDate(this._dateAdapter.getYear(month),
                monthIndex, i + 1);
            const enabled = (!this.dateFilter || this.dateFilter(date)) && monthIndex <= this._getLastEnabledMonth();
            const ariaLabel = this._dateAdapter.format(date, {year: 'numeric', month: 'long', day: 'numeric'});
            weeks[weeks.length - 1]
                .push(new CalendarCell(i + 1, dateNames[i], ariaLabel, enabled, date, shortMonthName));
        }

        const prevMonthInd = monthIndex > 0 ? monthIndex - 1 : 11;
        const prevMonth = this.months[prevMonthInd];
        if (prevMonth) {
            const prevMonthLastWeek = prevMonth[prevMonth.length - 1].concat();
            const firstWeek = weeks[0].concat();
            weeks[0] = prevMonthLastWeek.concat(firstWeek);
            prevMonth[prevMonth.length - 1] = prevMonth[prevMonth.length - 1].concat(firstWeek);
        }

        return weeks;
    }

    private _getFirstWeekOffset(month: Date): number {
        const monthIndex = this._dateAdapter.getMonth(month);
        const firstOfMonth = this._getFirstDateForMonth(this._dateAdapter.getYear(month), monthIndex);
        return (DAYS_PER_WEEK + this._dateAdapter.getDayOfWeek(firstOfMonth) -
            this._dateAdapter.getFirstDayOfWeek()) % DAYS_PER_WEEK;
    }

    private _dateSelected(date) {
        this.selected = date;
        this.currentMonth = this._dateAdapter.getMonth(this.selected);
        if (!this.opened) {
            this.currentRow = this._getDateWeekIndex(date);
        }
        this.selectedChange.next(date);
    }

    private _isDateBelongWeek(week: CalendarCell[], date?: Date): boolean {
        const selected = date || this.selected;
        for (let day of week) {
            if (this._dateAdapter.compareDate(day.date, selected) === 0) {
                return true;
            }

        }
        return false;
    }

    private _getDateWeekIndex(date: Date): number {
        const monthIndex = this._dateAdapter.getMonth(date);
        const month = this.months[monthIndex];
        for (let i = 0; i < month.length; i++) {

            if (this._isDateBelongWeek(month[i], date)) {
                return i;
            }
        }
        return -1;
    }

    private _getFirstDateForMonth(year: number, month: number): Date {
        return this._dateAdapter.createDate(year, month, 1);
    }

    private _getLastDateForMonth(year: number, month: number): Date {
        return this._dateAdapter.createDate(year, month + 1, 0);
    }

    private _checkNavButtonsEnabled(): void {
        if (!this.opened) {
            this.nextEnabled = (this._currentMonth < (this._todayMonth + this.range - 1) ||
                this._currentRow < this.months[this._currentMonth].length - 1);
            this.prevEnabled = this._todayRow < this._currentRow || this._currentMonth > this._todayMonth;
        } else {
            this.nextEnabled = this._currentMonth < this._getLastEnabledMonth();
            this.prevEnabled = this._currentMonth > this._todayMonth;
        }

    }

    private _getLastEnabledMonth(): number {
        return this._todayMonth + this.range - 1;
    }

    private _onCalendarClose(): void {
        if (this.selected && this._selectedMonth === this._currentMonth) {
            this.currentRow = this._getDateWeekIndex(this.selected);
        } else if (this._todayMonth === this._currentMonth) {
            this.currentRow = this._getDateWeekIndex(this._dateAdapter.today());
        } else if (this._oldMonth !== this._currentMonth) {
            this.currentRow = 0;
        }
    }

    getContainerHeight(opened: Boolean, currentMonth: number) {
        return opened ? (this.getRowHeight(this.weekRowElement) * this.months[currentMonth].length) + this.getRowHeight(this.daysRowElement) :
            this.getRowHeight(this.weekRowElement) + this.getRowHeight(this.daysRowElement);
    }
}

export class CalendarCell {
    constructor(public value: number,
                public displayValue: string,
                public ariaLabel: string,
                public enabled: boolean,
                public date: Date,
                public monthShort: string) {
    }

    get month() {
        return this.date.getMonth();
    }
}

const DAYS_PER_WEEK = 7;
