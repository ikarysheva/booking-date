import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { TdMediaService } from '@covalent/core';
import { MasterDateTime } from '../shared/master-date-time';

@Component({
    selector: 'app-booking-time-grid',
    templateUrl: './booking-time-grid.component.html',
    styleUrls: ['./booking-time-grid.component.scss']
})
export class BookingTimeGridComponent implements AfterViewInit {

    @Input() selectedDate: Date;
    @Input() times: MasterDateTime;
    @Input() selected = false;
    @Output() selectTime = new EventEmitter<number>();

    @Input() selectedIndex: number;


    constructor(public media: TdMediaService,
                private _changeDetectorRef: ChangeDetectorRef) {
    }


    ngAfterViewInit(): void {
        this.media.broadcast();
        this._changeDetectorRef.detectChanges();
    }

    onTileClick(index: number) {
        this.selectTime.next(this.times[index]);
    }
}
