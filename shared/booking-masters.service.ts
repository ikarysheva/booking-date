import { Injectable } from '@angular/core';
import { Master } from '../../../shared/master.model';
import { SERVICE_MASTER, ServicesDataStorageService } from '../../../core/storage/services-data-storage.service';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class BookingMastersService {
    serviceMasters: Master[];

    serviceMastersChanged = new Subject<Master[]>();


    constructor(private _dataStorageService: ServicesDataStorageService) {
    }

    async loadServiceMasters(serviceId: number): Promise<void> {
        try {
            this.serviceMasters = await this._dataStorageService.get(SERVICE_MASTER.replace(':id', serviceId + '')).toPromise();
        } catch (error) {
            this.serviceMasters = await this._dataStorageService.staticQuery().toPromise();
        } finally {
            this.serviceMastersChanged.next(this.serviceMasters);
        }
    }

    getServiceMaster(masterId: number): Master {
        for (const master of this.serviceMasters) {
            if (master.id === masterId) {
                return master;
            }

        }
        return null;
    }
}
