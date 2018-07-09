import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TdMediaService } from "@covalent/core";
import { MasterDateTime } from "../../shared/master-date-time";
import { Master } from "../../../../shared/master.model";
import { BookingDateService } from "../../shared/booking-date.service";
import {DateAdapter} from "@angular/material";

@Component({
    selector: 'app-booking-master-item',
    templateUrl: './booking-master-item.component.html',
    styleUrls: ['./booking-master-item.component.scss']
})
export class BookingMasterItemComponent implements OnInit, AfterViewInit {
    
    
    @Input() master: Master;
    @Input() selectedTime: number;
    @Input() selected = false;
    
    private _selectedDate: Date;
    
    get selectedDate(): Date {
        return this._selectedDate;
    }
    
    @Input()
    set selectedDate(value: Date) {
        this._selectedDate = value;
        if (value) {
            console.log(value);
            this.masterDateTime = this.getMasterTimes();
        }
    }
    
    masterDateTime: MasterDateTime;
    
    
    @Output() selectTime = new EventEmitter<{date: Date, time: number}>();
    
    constructor(public media: TdMediaService,
                private _changeDetectorRef: ChangeDetectorRef,
                private _bookingDateService: BookingDateService,
                private _dateAdapter: DateAdapter<any>) {
    }
    
    ngOnInit() {
        this.masterDateTime = this.getMasterTimes();
    }
    
    ngAfterViewInit(): void {
        this.media.broadcast();
        this._changeDetectorRef.detectChanges();
    }
    
    
    onTileClick(index: number) {
        this.selectTime.next({date: this.masterDateTime.date, time: this.masterDateTime.times[index]});
    }
    
    getMasterTimes(): MasterDateTime {
        
        const date = this._selectedDate || new Date();
        return this._bookingDateService.getEnabledDateForMaster(date, this.master.id);
    }
    
    getNextDateEqualsSelected(date: Date): boolean {
        return this._selectedDate ? this._dateAdapter.compareDate(date, this._selectedDate) === 0 : false;
    }
}
