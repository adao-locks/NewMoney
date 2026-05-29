import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService, emptySummary, FinancialSummary } from '../../services/transaction.service';
import { InvestmentMovement, PersonalAsset, Transaction } from '../../models/transaction.model';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
    summary: FinancialSummary = emptySummary();
    latest: Transaction[] = [];
    investmentsByClass: Array<{ label: string; value: number }> = [];
    expensesByCategory: Array<{ label: string; value: number }> = [];
    assetsByCategory: Array<{ label: string; value: number }> = [];
    assets: PersonalAsset[] = [];
    loading = false;
    readonly Math = Math;
    errorMessage = '';

    constructor(private service: TransactionService) { }

    ngOnInit() {
        this.loadDashboard();
    }

    private async loadDashboard() {
        this.loading = true;
        this.errorMessage = '';

        try {
            const [allItems, assets] = await Promise.all([
                this.service.getAll(),
                this.service.getAssets(),
            ]);

            this.summary = this.service.calculateSummary(allItems, assets);
            this.latest = allItems.slice(0, 8);
            this.assets = assets.slice(0, 5);
            this.investmentsByClass = this.groupBy(
                allItems.filter((item) =>
                    item.type === 'investment_in' || item.type === 'investment_out' || item.type === 'investment_return'
                ),
                'assetClass'
            );
            this.expensesByCategory = this.groupBy(
                allItems.filter((item) => (item.type ?? 'expense') === 'expense'),
                'category'
            );
            this.assetsByCategory = this.groupBy(
                assets.filter((asset) => asset.status !== 'vendido').map((asset) => ({
                    ...asset,
                    amount: Number(asset.currentValue || 0),
                    category: asset.category,
                })),
                'category'
            );
        } catch {
            this.errorMessage = 'Nao foi possivel carregar o dashboard.';
        } finally {
            this.loading = false;
        }
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
            const label = item?.[field] || 'Sem categoria';
            totals.set(label, (totals.get(label) ?? 0) + Math.abs(Number(item.amount || 0)));
        });
        return [...totals.entries()].map(([label, value]) => ({ label, value }));
    }
}
