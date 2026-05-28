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
        return this.service.getAll().slice(0, 8);
    }

    get investmentsByClass() {
        return this.groupBy(this.service.getInvestmentMovements(), 'assetClass');
    }

    get expensesByCategory() {
        return this.groupBy(
            this.service.getAll().filter((item) => (item.type ?? 'expense') === 'expense'),
            'category'
        );
    }

    get assetsByCategory() {
        const totals = new Map<string, number>();
        this.service.getAssets().forEach((asset) => {
            if (asset.status === 'vendido') {
                return;
            }
            totals.set(asset.category, (totals.get(asset.category) ?? 0) + Number(asset.currentValue || 0));
        });
        return [...totals.entries()].map(([label, value]) => ({ label, value }));
    }

    get assets() {
        return this.service.getAssets().slice(0, 5);
    }

    get cashFlowHealth() {
        if (!this.summary.ganhos) {
            return 0;
        }
        return Math.round((this.summary.balance / this.summary.ganhos) * 100);
    }

    labelFor(type = '') {
        const labels: Record<string, string> = {
            income: 'Ganho',
            expense: 'Gasto',
            investment_in: 'Aporte',
            investment_out: 'Resgate',
            investment_return: 'Rendimento',
        };
        return labels[type] ?? 'Movimento';
    }

    private groupBy(items: any[], field: string) {
        const totals = new Map<string, number>();
        items.forEach((item) => {
            const label = item[field] || 'Sem categoria';
            totals.set(label, (totals.get(label) ?? 0) + Math.abs(Number(item.amount || 0)));
        });
        return [...totals.entries()].map(([label, value]) => ({ label, value }));
    }
}
