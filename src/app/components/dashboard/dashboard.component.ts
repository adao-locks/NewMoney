import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, emptySummary, FinancialSummary } from '../../services/transaction.service';
import { InvestmentMovement, PersonalAsset, Transaction } from '../../models/transaction.model';
import { Chart, registerables, ChartOptions } from 'chart.js';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
    summary: FinancialSummary = emptySummary();
    latest: Transaction[] = [];
    investmentsByClass: Array<{ label: string; value: number }> = [];
    expensesByCategory: Array<{ label: string; value: number }> = [];
    assetsByCategory: Array<{ label: string; value: number }> = [];
    assets: PersonalAsset[] = [];
    investmentsDetails: InvestmentMovement[] = [];
    investmentsLabels: string[] = [];
    investmentsValues: number[] = [];
    expensesLabels: string[] = [];
    expensesValues: number[] = [];
    assetsLabels: string[] = [];
    assetsValues: number[] = [];
    filteredTransactionsCount = 0;
    filteredAssetsCount = 0;
    chartOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' as const } }
    };

    @ViewChild('investmentsCanvas') investmentsCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('expensesCanvas') expensesCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('assetsCanvas') assetsCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('mainChartCanvas') mainChartCanvas!: ElementRef<HTMLCanvasElement>;

    private investmentsChart?: Chart;
    private expensesChart?: Chart;
    private assetsChart?: Chart;
    private mainChart?: Chart;
    loading = false;
    readonly Math = Math;
    errorMessage = '';
    period: 'day' | 'month' | 'year' | 'total' = 'month';
    selectedDate = new Date().toISOString().substring(0, 10);
    selectedMonth = new Date().toISOString().substring(0, 7);
    selectedYear = String(new Date().getFullYear());
    searchTerm = '';

    private allItems: Transaction[] = [];
    private allAssets: PersonalAsset[] = [];
    private allInvestmentMoves: InvestmentMovement[] = [];

    constructor(private service: TransactionService) { }

    ngOnInit() {
        this.loadDashboard();
    }

    ngAfterViewInit() {
        Chart.register(...registerables);
        this.renderCharts();
    }

    private async loadDashboard() {
        this.loading = true;
        this.errorMessage = '';

        try {
            const [allItems, assets, investmentMoves] = await Promise.all([
                this.service.getAll(),
                this.service.getAssets(),
                this.service.getInvestmentMovements(),
            ]);

            this.allItems = allItems;
            this.allAssets = assets;
            this.allInvestmentMoves = investmentMoves;
            this.applyDashboardFilter();
        } catch {
            this.errorMessage = 'Nao foi possivel carregar o dashboard.';
        } finally {
            this.loading = false;
        }
    }

    setPeriod(p: 'day' | 'month' | 'year' | 'total') {
        this.period = p;
        this.applyDashboardFilter();
    }

    onReferenceChange() {
        this.applyDashboardFilter();
    }

    onSearch(value: string) {
        this.searchTerm = value?.trim() ?? '';
    }

    get filteredLatest() {
        const q = this.searchTerm.toLowerCase();
        if (!q) {
            return this.latest;
        }

        return this.latest.filter((t) => {
            return (
                String(t.description || '').toLowerCase().includes(q) ||
                String(t.category || '').toLowerCase().includes(q) ||
                String(t.account || '').toLowerCase().includes(q)
            );
        });
    }

    get totalCadastros() {
        return this.filteredTransactionsCount + this.filteredAssetsCount;
    }

    get periodLabel() {
        if (this.period === 'total') {
            return 'Todos os cadastros';
        }

        return `Registros ate ${this.getPeriodEndDate().toLocaleDateString('pt-BR')}`;
    }

    private applyDashboardFilter() {
        const filteredItems = this.filterByPeriod(this.allItems, 'date');
        const filteredAssets = this.filterByPeriod(this.allAssets, 'acquisitionDate');
        const filteredInvestmentMoves = this.filterByPeriod(this.allInvestmentMoves, 'date');

        this.filteredTransactionsCount = filteredItems.length;
        this.filteredAssetsCount = filteredAssets.length;
        this.summary = this.service.calculateSummary(filteredItems, filteredAssets);
        this.latest = filteredItems.slice(0, 8);
        this.assets = filteredAssets.slice(0, 5);
        this.investmentsDetails = filteredInvestmentMoves;
        this.investmentsByClass = this.groupBy(
            filteredItems.filter((item) =>
                item.type === 'investment_in' || item.type === 'investment_out' || item.type === 'investment_return'
            ),
            'assetClass'
        );
        this.expensesByCategory = this.groupBy(
            filteredItems.filter((item) => (item.type ?? 'expense') === 'expense'),
            'category'
        );
        this.assetsByCategory = this.groupBy(
            filteredAssets.filter((asset) => asset.status !== 'vendido').map((asset) => ({
                ...asset,
                amount: Number(asset.currentValue || 0),
                category: asset.category,
            })),
            'category'
        );

        this.buildCharts();
        this.renderCharts();
    }

    private filterByPeriod<T>(items: T[], dateField: keyof T): T[] {
        if (this.period === 'total') {
            return [...items];
        }

        const endDate = this.getPeriodEndDate();
        endDate.setHours(23, 59, 59, 999);

        return items.filter((item) => {
            const itemDate = this.toDate(item[dateField]);
            return itemDate ? itemDate <= endDate : false;
        });
    }

    private getPeriodEndDate() {
        if (this.period === 'day') {
            return this.toDate(this.selectedDate) ?? new Date();
        }

        if (this.period === 'month') {
            const [year, month] = this.selectedMonth.split('-').map(Number);
            return new Date(year, month, 0);
        }

        const year = Number(this.selectedYear) || new Date().getFullYear();
        return new Date(year, 11, 31);
    }

    private toDate(value: unknown) {
        if (!value) {
            return null;
        }

        if (value instanceof Date) {
            return value;
        }

        if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
            return value.toDate() as Date;
        }

        const date = new Date(String(value));
        return Number.isNaN(date.getTime()) ? null : date;
    }

    private buildCharts() {
        this.investmentsLabels = this.investmentsByClass.map((i) => i.label);
        this.investmentsValues = this.investmentsByClass.map((i) => i.value);

        this.expensesLabels = this.expensesByCategory.map((i) => i.label);
        this.expensesValues = this.expensesByCategory.map((i) => i.value);

        this.assetsLabels = this.assetsByCategory.map((i) => i.label);
        this.assetsValues = this.assetsByCategory.map((i) => i.value);
    }

    private renderCharts() {
        const makeColors = (n: number) => Array.from({ length: n }, (_, i) => `hsl(${(i * 55) % 360} 70% 50%)`);

        if (this.investmentsCanvas) {
            const ctx = this.investmentsCanvas.nativeElement.getContext('2d')!;
            this.investmentsChart?.destroy();
            this.investmentsChart = new Chart(ctx, {
                type: 'doughnut',
                data: { labels: this.investmentsLabels, datasets: [{ data: this.investmentsValues, backgroundColor: makeColors(this.investmentsLabels.length) }] },
                options: this.chartOptions,
            });
        }

        if (this.expensesCanvas) {
            const ctx = this.expensesCanvas.nativeElement.getContext('2d')!;
            this.expensesChart?.destroy();
            this.expensesChart = new Chart(ctx, {
                type: 'pie',
                data: { labels: this.expensesLabels, datasets: [{ data: this.expensesValues, backgroundColor: makeColors(this.expensesLabels.length) }] },
                options: this.chartOptions,
            });
        }

        if (this.assetsCanvas) {
            const ctx = this.assetsCanvas.nativeElement.getContext('2d')!;
            this.assetsChart?.destroy();
            this.assetsChart = new Chart(ctx, {
                type: 'pie',
                data: { labels: this.assetsLabels, datasets: [{ data: this.assetsValues, backgroundColor: makeColors(this.assetsLabels.length) }] },
                options: this.chartOptions,
            });
        }

        if (this.mainChartCanvas) {
            const ctx = this.mainChartCanvas.nativeElement.getContext('2d')!;
            this.mainChart?.destroy();
            const labels = this.investmentsLabels.length ? this.investmentsLabels : this.assetsLabels;
            const data = this.investmentsValues.length ? this.investmentsValues : this.assetsValues;
            this.mainChart = new Chart(ctx, {
                type: 'bar',
                data: { labels, datasets: [{ label: 'Valor', data, backgroundColor: makeColors(labels.length) }] },
                options: { ...this.chartOptions, scales: { x: { stacked: false }, y: { beginAtZero: true } } },
            });
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
