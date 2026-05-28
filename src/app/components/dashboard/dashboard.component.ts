import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
    service = new TransactionService();

    get summary() {
        return this.service.getSummary();
    }

    get latest() {
        return this.service.getAll().slice(0, 5);
    }
}
