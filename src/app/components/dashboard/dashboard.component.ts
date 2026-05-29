import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService, emptySummary, FinancialSummary } from '../../services/transaction.service';
import { InvestmentMovement, PersonalAsset, Transaction } from '../../models/transaction.model';
import { Chart, registerables, ChartOptions } from 'chart.js';

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
    investmentsDetails: InvestmentMovement[] = [];
    investmentsLabels: string[] = [];
    investmentsValues: number[] = [];
    expensesLabels: string[] = [];
    expensesValues: number[] = [];
    assetsLabels: string[] = [];
    assetsValues: number[] = [];
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
    // Controls state
    period: 'day' | 'week' | 'month' | 'year' = 'month';
    dateRange = '1 Sep 2024 - 31 Sep 2024';
    searchTerm = '';

    constructor(private service: TransactionService) { }

    ngOnInit() {
        this.loadDashboard();
    }

    ngAfterViewInit() {
        Chart.register(...registerables);
        // Ensure charts render after view is ready (data may already be loaded)
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

            this.summary = this.service.calculateSummary(allItems, assets);
            this.latest = allItems.slice(0, 8);
            this.assets = assets.slice(0, 5);
            this.investmentsDetails = investmentMoves;
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

            this.buildCharts();
            this.renderCharts();
        } catch {
            this.errorMessage = 'Nao foi possivel carregar o dashboard.';
        } finally {
            this.loading = false;
        }
    }

    setPeriod(p: 'day' | 'week' | 'month' | 'year') {
        this.period = p;
        // for now, rebuilding charts is enough; later we can filter data by period
        this.buildCharts();
        this.renderCharts();
    }

    changeDateRange() {
        const value = prompt('Informe o período (ex: 1 Sep 2024 - 30 Sep 2024)', this.dateRange);
        if (value) {
            this.dateRange = value;
            // could trigger data reload with new range
        }
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

    private buildCharts() {
        const makeColors = (n: number) => Array.from({ length: n }, (_, i) => `hsl(${(i * 55) % 360} 70% 50%)`);

        this.investmentsLabels = this.investmentsByClass.map((i) => i.label);
        this.investmentsValues = this.investmentsByClass.map((i) => i.value);

        this.expensesLabels = this.expensesByCategory.map((i) => i.label);
        this.expensesValues = this.expensesByCategory.map((i) => i.value);

        this.assetsLabels = this.assetsByCategory.map((i) => i.label);
        this.assetsValues = this.assetsByCategory.map((i) => i.value);
    }

    private renderCharts() {
        const makeColors = (n: number) => Array.from({ length: n }, (_, i) => `hsl(${(i * 55) % 360} 70% 50%)`);

        // Investments chart
        if (this.investmentsCanvas) {
            const ctx = this.investmentsCanvas.nativeElement.getContext('2d')!;
            this.investmentsChart?.destroy();
            this.investmentsChart = new Chart(ctx, {
                type: 'doughnut',
                data: { labels: this.investmentsLabels, datasets: [{ data: this.investmentsValues, backgroundColor: makeColors(this.investmentsLabels.length) }] },
                options: this.chartOptions,
            });
        }

        // Expenses chart
        if (this.expensesCanvas) {
            const ctx = this.expensesCanvas.nativeElement.getContext('2d')!;
            this.expensesChart?.destroy();
            this.expensesChart = new Chart(ctx, {
                type: 'pie',
                data: { labels: this.expensesLabels, datasets: [{ data: this.expensesValues, backgroundColor: makeColors(this.expensesLabels.length) }] },
                options: this.chartOptions,
            });
        }

        // Assets chart
        if (this.assetsCanvas) {
            const ctx = this.assetsCanvas.nativeElement.getContext('2d')!;
            this.assetsChart?.destroy();
            this.assetsChart = new Chart(ctx, {
                type: 'pie',
                data: { labels: this.assetsLabels, datasets: [{ data: this.assetsValues, backgroundColor: makeColors(this.assetsLabels.length) }] },
                options: this.chartOptions,
            });
        }

        // Main big chart (reuse assets or investments data if available)
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
