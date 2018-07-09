import { Injectable } from '@angular/core';
import { DateAdapter } from '@angular/material';
import { Subject } from 'rxjs/Subject';
import { isNull, isNullOrUndefined, isUndefined } from 'util';
import { ScheduleDataStorageService } from '../../../core/storage/schedule-data-storage.service';
import { Master } from '../../../shared/master.model';
import { Service } from '../../../shared/service.model';
import { BookingStepService } from '../../shared/booking-step-service';
import { BookingMastersService } from './booking-masters.service';
import { MasterDateTime } from './master-date-time';

export class BookingDate {
    date: string;
    times: BookingTime[];
}

export class BookingTime {
    masterId: number;
    step: number;
    busy: [string[]];
    workday: string[];
    servicesIds: number[];

}

export class BookingMasterTime {

    constructor(public master: Master,
        public times: number[]) {
    }
}

@Injectable()
export class BookingDateService implements BookingStepService {

    dates: BookingDate[];
    selectedDate: Date;
    selectedMaster: Master;
    selectedTime: number;
    dateChanged = new Subject<Date>();
    maxDate: Date;
    minDate: Date = new Date();
    private _mastersLib: { [key: number]: BookingMasterTime[] } = {};
    private _enabledDates: Date[];

    constructor(private _dataStorageService: ScheduleDataStorageService,
        private _bookingMastersService: BookingMastersService,
        private dateAdapter: DateAdapter<any>) {
        this.maxDate = this.dateAdapter.addCalendarMonths(this.minDate, 2);
    }

    private _selectedService: Service;

    set selectedService(value: Service) {
        this._selectedService = value;
        this.selectedDate = null;
        this.selectedMaster = null;
        this.selectedTime = null;
    }


    get selectedService(): Service {
        return this._selectedService;
    }

    public get changes() {
        return this.dateChanged.asObservable();
    }

    async getBookingDates(): Promise<void> {
        this._enabledDates = [];
        const promises: Promise<void>[] = [];
        promises.push(this.getDates());
        promises.push(this._bookingMastersService.loadServiceMasters(this._selectedService.id));
        return Promise.all(promises).then(() => {

            let date: Date;
            for (const bookingDate of this.dates) {
                let enableMasters: BookingMasterTime[];
                if (bookingDate) {
                    date = this.dateAdapter.parse(bookingDate.date, 'YYYY-MM-DD');
                    enableMasters = this._getMastersFromLib(date);
                    if (!enableMasters) {
                        enableMasters = this.getEnableTimesForDate(date);

                    }
                }

                const enabled = !isNullOrUndefined(enableMasters) && this.dateAdapter.compareDate(this.minDate, date) < 0;
                if (enabled) {
                    this._setMastersToLib(date, enableMasters);
                    this._enabledDates.push(date);
                }
            }
        });
    }

    async getDates(): Promise<void> {
        return this.dates = await this._dataStorageService.get(this._getDateString()).toPromise();
        // try {
        //     this.dates = await this._dataStorageService.get(this._getDateString()).toPromise();
        // } catch (error) {
        //     this.dates = await this._dataStorageService.staticQuery().toPromise();
        // }
    }

    getEnableTimesForDate(date: Date, masterId?: number): BookingMasterTime[] {
        let result: BookingMasterTime[] = [];
        if (!isNullOrUndefined(this._getMastersFromLib(date))) {
            result = this._getMastersFromLib(date);
        } else {
            const bookingDate = this.getBookingDate(date);
            let master: Master;
            if (bookingDate) {
                let hrs: number[];
                for (const time of bookingDate.times) {
                    if (time.servicesIds.indexOf(this._selectedService.id) !== -1) {
                        master = this._bookingMastersService.getServiceMaster(time.masterId);
                        if (master) {
                            hrs = this.getEnableHours(time, this._selectedService.categories[master.professional_category].time / 60);
                            if (hrs.length > 0) {
                                result.push(new BookingMasterTime(master, hrs));
                            }
                        }
                    }
                }
            }

        }
        if (!isUndefined(masterId)) {
            return result.filter((item: BookingMasterTime) => {
                return item.master.id === masterId;
            });
        }
        return result;
    }

    getEnableHours(time: BookingTime, serviceTime: number): number[] {
        console.log('serviceTime: ' + serviceTime);
        const enableTimes = [];
        const step = 1; // time.step;
        const stepsInTime: number = Math.ceil(serviceTime / step);

        let isBusy = false;
        const start = this.parseTimeString(time.workday[0]);
        const end = this.parseTimeString(time.workday[1]);
        let busy: number[];
        for (let i = start; i < end; i += step) {
            let j = i;
            isBusy = i + stepsInTime > end;
            while (!isBusy && j < i + stepsInTime) {
                busy = this._getBusyHrs(time.busy, step);
                if (busy.indexOf(j) !== -1) {
                    isBusy = true;
                }
                j++;
            }
            if (!isBusy) {
                enableTimes.push(i);
            }
            isBusy = false;
        }
        return enableTimes;
    }

    getBookingDate(date: Date): BookingDate {
        let parsedDate: Date;
        for (const item of this.dates) {
            parsedDate = this.dateAdapter.parse(item.date, 'YYYY-MM-DD');
            if (this.dateAdapter.compareDate(parsedDate, date) === 0) {
                return item;
            }
        }
        return null;
    }

    setSelectedMaster(master: Master) {
        this.selectedMaster = master;
        this.selectedTime = null;

    }

    setSelectedTime(time: number) {
        this.selectedTime = time;
        const hrs = Math.floor(this.selectedTime);
        this.selectedDate.setHours(hrs, this.selectedTime % hrs * 60);
        this.dateChanged.next(this.selectedDate);
    }

    setSelectedDate(date: Date, clearTime: boolean) {
        this.selectedDate = date;
        if (clearTime) {
            this.selectedTime = null;
        }
        this.dateChanged.next(this.selectedDate);
        console.log('this.selectedDate: ' + this.selectedDate);
    }

    isStepComplete(): boolean {
        return !isNullOrUndefined(this.selectedTime);
    }

    calendarDateFilter(date: Date): boolean {
        // const bookingDate: BookingDate = this.getBookingDate(date);
        // let enableMasters: BookingMasterTime[];
        // if (bookingDate) {
        //     enableMasters = this._mastersLib[date.getServiceTime()];
        //     if (!enableMasters) {
        //         enableMasters = this.getEnableTimesForDate(date);
        //         this._mastersLib[date.getServiceTime()] = enableMasters;
        //     }
        // }
        //
        // const enabled = !isNullOrUndefined(enableMasters) && this.dateAdapter.compareDate(this.minDate, date) < 0;
        // if (enabled) {
        //     this._enabledDates.push(date);
        // }
        return this.getDateIndex(date) !== -1;
    }

    getEnabledDateForMaster(afterDate: Date, masterId: number): MasterDateTime {
        let counter = 0;
        const date: Date = this.dateAdapter.createDate(afterDate.getFullYear(),
            afterDate.getMonth(), afterDate.getDate());
        let checkDate: Date = this.dateAdapter.addCalendarDays(date, counter);
        let list;
        const master = new MasterDateTime(masterId, checkDate, null);
        while (master.times === null && counter < 100) {

            if (!isNullOrUndefined(this._getMastersFromLib(checkDate))) {
                list = this._getMastersFromLib(checkDate);
                for (const item of list) {
                    if (item.master.id === masterId) {
                        master.date = checkDate;
                        master.times = item.times;
                        break;
                    }
                }
            }

            counter++;
            checkDate = this.dateAdapter.addCalendarDays(date, counter);
        }

        return master;
    }

    parseTimeString(src: string): number {
        const hrs = +src.split(':')[0];
        const minutes = +src.split(':')[1];
        return hrs + minutes / 60;
    }

    getDateIndex(date: Date): number {
        for (let i = 0; i < this._enabledDates.length; i++) {
            if (this.dateAdapter.compareDate(date, this._enabledDates[i]) === 0) {
                return i;
            }
        }
        return -1;
    }

    getNextDateEnabled(): boolean {
        return this.dateAdapter.compareDate(this.selectedDate, this.maxDate) < 0 && !isNull(this.getNextDate());
    }

    getPrevDateEnabled(): boolean {
        return this.dateAdapter.compareDate(this.selectedDate, this.minDate) > 1 && !isNull(this.getPrevDate());
    }

    getNextDate(): Date {
        const index = this.getDateIndex(this.selectedDate);
        if (index !== -1 && index + 1 < this._enabledDates.length) {
            return this._enabledDates[index + 1];
        }
        return null;
    }

    getPrevDate(): Date {
        const index = this.getDateIndex(this.selectedDate);
        if (index !== -1 && index > 0) {
            return this._enabledDates[index - 1];
        }
    }

    getStartDate(): Date {
        const startDate = new Date();
        const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        if (this.dateAdapter.compareDate(startDate, lastDayOfMonth) === 0) {
            return new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
        }
        return startDate;
    }

    findSelectedMaterTime(masterTimes: BookingMasterTime[]): BookingMasterTime {
        if (this.selectedMaster) {
            for (const masterTime of masterTimes) {
                if (masterTime.master.id === this.selectedMaster.id) {
                    return masterTime;
                }
            }
        }
        return null;
    }

    setMonthRange(monthRange: number) {
        this.maxDate = this.dateAdapter.addCalendarMonths(this.dateAdapter.today(), monthRange);
    }

    getFirstEnableDate(): Date {
        let i = 1;
        const today = this.dateAdapter.today();
        let date: Date;
        while (i < 100) {
            date = this.dateAdapter.addCalendarDays(today, i);
            if (this.calendarDateFilter(date)) {
                return date;
            }
            i++;
        }
        return today;
    }

    private _getDateString(): string {
        const date = new Date();
        return date.getFullYear() + '' + (date.getMonth() + 1) + '/' + 2;
    }

    private _getMastersFromLib(date: Date): BookingMasterTime[] {
        const key = this.dateAdapter.format(date, { year: 'numeric', month: 'numeric', day: 'numeric' });
        return this._mastersLib[key];
    }


    private _setMastersToLib(date: Date, masters: BookingMasterTime[]): void {
        const key = this.dateAdapter.format(date, { year: 'numeric', month: 'numeric', day: 'numeric' });
        this._mastersLib[key] = masters;
    }

    private _getBusyHrs(busy: [string[]], step: number): number[] {
        const result: number[] = [];
        let start: number;
        let end: number;
        for (let i = 0; i < busy.length; i++) {
            start = this.parseTimeString(busy[i][0]);
            end = Math.ceil(this.parseTimeString(busy[i][1]));
            while (end > start) {
                end -= step;
                result.push(end);
            }
        }
        return result;
    }
}
