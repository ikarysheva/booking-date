import {
    AfterViewInit, Component, ComponentFactory, ComponentFactoryResolver, ComponentRef, EventEmitter, OnDestroy, OnInit,
    ViewChild, ViewContainerRef
} from '@angular/core';
import { MatCalendar } from '@angular/material';
import { TdExpansionPanelComponent, TdLoadingService } from '@covalent/core';
import { isNull } from 'util';
import { BookingDateService } from '../shared/booking-date.service';
import { FullScreenLoadingService } from '../../../core/full-screen-loading.service';

@Component({
    selector: 'app-booking-calendar',
    templateUrl: './booking-calendar.component.html',
    styleUrls: ['./booking-calendar.component.scss'],
    entryComponents: [MatCalendar]
})


export class BookingCalendarComponent implements OnInit, AfterViewInit, OnDestroy {


    @ViewChild('calendarContainer', {read: ViewContainerRef}) container;
    @ViewChild('calendarPanel') calendarPanel: TdExpansionPanelComponent;

    componentRef: ComponentRef<MatCalendar<Date>>;

    selectedDate: Date;


    nextDateEnabled: boolean;
    prevDateEnabled: boolean;
    private _calendarSelectChanged: EventEmitter<Date>;
    private _calendarInst: MatCalendar<Date>;

    constructor(private _resolver: ComponentFactoryResolver,
                private _loadingService: FullScreenLoadingService,
                private _bookingDateService: BookingDateService) {
    }

    ngOnInit() {

    }


    ngOnDestroy(): void {
        if (this.componentRef && this._calendarSelectChanged) {
            this._calendarSelectChanged.unsubscribe();
            this.componentRef.destroy();
        }

    }

    ngAfterViewInit(): void {
        if (!this._bookingDateService.dates) {
            this._loadingService.registerLoader();
            this._createDefaultCalendar();
            this._bookingDateService.getBookingDates().then(() => {
                this._loadingService.resolveLoader();
                this._createCalendar();

            }).catch(error => {
              console.log('error');
              throw error;
            });
        } else {
            this._createCalendar();
        }

    }

    onNextButtonClick(event: Event): void {

        event.cancelBubble = true;
        const nextDate = this._bookingDateService.getNextDate();
        if (!isNull(nextDate)) {
            this._setSelectedDate(nextDate);
        }
    }

    onPrevButtonClick(event: Event): void {
        event.cancelBubble = true;
        const nextDate = this._bookingDateService.getPrevDate();
        if (!isNull(nextDate)) {
            this._setSelectedDate(nextDate);
        }
    }

    private _createCalendar(): void {
        console.log('create calendar');
        this.container.clear();
        const factory: ComponentFactory<any> = this._resolver.resolveComponentFactory(MatCalendar);
        this.componentRef = this.container.createComponent(factory);
        this._calendarInst = this.componentRef.instance;
        this._calendarInst.minDate = this._bookingDateService.minDate;
        this._calendarInst.maxDate = this._bookingDateService.maxDate;
        this._calendarInst.startAt = this._bookingDateService.getStartDate();
        this._calendarSelectChanged = this._calendarInst.selectedChange.subscribe((date: Date) => {
            this._setSelectedDate(date);
            this.calendarPanel.toggle();
        });
        if (this._bookingDateService.selectedDate) {
            this._setSelectedDate(this._bookingDateService.selectedDate, false);
        }
        this._setDateFilter();


    }

    private _createDefaultCalendar(): void {
        console.log('create default calendar');
        this.container.clear();
        const factory: ComponentFactory<any> = this._resolver.resolveComponentFactory(MatCalendar);
        this.componentRef = this.container.createComponent(factory);
    }

    private _setSelectedDate(date: Date, clearTime: boolean = true): void {
        this.selectedDate = date;
        this._calendarInst.selected = date;
        this._bookingDateService.setSelectedDate(date, clearTime);
        this.nextDateEnabled = this._bookingDateService.getNextDateEnabled();
        this.prevDateEnabled = this._bookingDateService.getPrevDateEnabled();

    }

    private _setDateFilter(): void {
        this._calendarInst.dateFilter = (date: Date) => {
            return this._bookingDateService.calendarDateFilter(date);
        };
    }

}
