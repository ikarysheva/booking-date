import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { BookingDateService, BookingMasterTime } from '../shared/booking-date.service';
import { Master } from '../../../shared/master.model';
import { BookingMastersService } from '../shared/booking-masters.service';
import { MasterDateTime } from '../shared/master-date-time';

@Component({
    selector: 'app-booking-masters',
    templateUrl: './booking-masters.component.html',
    styleUrls: ['./booking-masters.component.scss']
})
export class BookingMastersComponent implements OnInit, OnDestroy, AfterViewInit {

    masters: Master[];

    selectedTime: number;
    selectedDate: Date;
    selectedMaster: Master;

    private _dateSubscription: Subscription;
    private _mastersSubscription: Subscription;


    constructor(private _bookingDateService: BookingDateService,
                private _bookingMastersService: BookingMastersService) {
    }

    ngOnInit() {
        if (this._bookingDateService.selectedDate) {
            this._onDateChanged();
        }
        this._dateSubscription = this._bookingDateService.dateChanged.subscribe((date: Date) => {
            this._onDateChanged();
        });
        this.masters = this._bookingMastersService.serviceMasters;
        this._mastersSubscription = this._bookingMastersService.serviceMastersChanged.subscribe((masters: Master[]) => {
            this.masters = masters;
            console.log('masters: ' + masters.length);
        });
    }

    ngOnDestroy(): void {
        if (this._dateSubscription) {
            this._dateSubscription.unsubscribe();
        }
        if (this._mastersSubscription) {
            this._mastersSubscription.unsubscribe();
        }

    }

    clearSelection() {

    }

    ngAfterViewInit(): void {
    }

    onTimeSelected(data: {date: Date, time: number}, master: Master) {
        // this.selectedTime = data.time;
        // this.selectedMaster = master;
        this._bookingDateService.setSelectedMaster(master);
        this._bookingDateService.setSelectedDate(data.date, false);
        this._bookingDateService.setSelectedTime(data.time);

    }

    private _onDateChanged(): void {
        console.log('_onDateChanged');
        this.selectedDate = this._bookingDateService.selectedDate;
        this.selectedTime = this._bookingDateService.selectedTime;
        this.selectedMaster = this._bookingDateService.selectedMaster;
    }
}
