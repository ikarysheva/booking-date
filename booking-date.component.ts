import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { TdMediaService } from '@covalent/core';
import { FullScreenLoadingService } from '../../core/full-screen-loading.service';
import { BookingDateService } from './shared/booking-date.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-booking-date',
    templateUrl: './booking-date.component.html',
    styleUrls: ['./booking-date.component.scss']
})
export class BookingDateComponent implements OnInit, AfterViewInit, OnDestroy, AfterContentInit {
    subscription: Subscription;
    resolve: (value?: Date | PromiseLike<Date>) => void;

    monthRange = 2;

    firstEnableDate: Promise<Date> | null = null;
    selectedDate: Date = null;

    dateFilter: (date: Date) => boolean;

    constructor(public media: TdMediaService,
                private _changeDetectorRef: ChangeDetectorRef,
                private _bookingDateService: BookingDateService,
                private _loadingService: FullScreenLoadingService) {
        this.firstEnableDate = new Promise<Date>((resolve, reject) => {
            this.resolve = resolve;
        });

    }

    ngOnInit() {
        this.dateFilter = this._bookingDateService.calendarDateFilter.bind(this._bookingDateService);
        this.subscription = this._bookingDateService.dateChanged.subscribe((date: Date) => {
            this.selectedDate = date;
        });
    }

    ngAfterViewInit(): void {
        this.media.broadcast();
        this._changeDetectorRef.detectChanges();
        if (!this._bookingDateService.dates) {
            this._loadingService.registerLoader();
            this._bookingDateService.setMonthRange(this.monthRange);
            this._bookingDateService.getBookingDates().then(() => {
                this._loadingService.resolveLoader();
                this.resolve(this._bookingDateService.getFirstEnableDate());

            }).catch(error => {
                console.log('error');
                throw error;
            });
        }
    }


    ngAfterContentInit(): void {
        this.selectedDate = this._bookingDateService.selectedDate;
        if (this._bookingDateService.dates) {
            this.resolve(this._bookingDateService.getFirstEnableDate());
        }
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    onSelectedChanged(date: Date): void {
        this._bookingDateService.setSelectedDate(date, true);
    }
}
