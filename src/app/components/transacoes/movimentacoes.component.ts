import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Transaction } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction.service';

interface FilterOptions {
    searchText: string;
    dateFrom: string;
    dateTo: string;
    category: string;
    type: string;
    minAmount: number | null;
    maxAmount: number | null;
}

@Component({
    selector: 'app-movimentacoes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './movimentacoes.component.html',
    styleUrls: ['./movimentacoes.component.css'],
})
export class MovimentacoesComponent implements OnInit {
    Math = Math; // Expor Math para o template
    allTransactions: Transaction[] = [];
    filteredTransactions: Transaction[] = [];
    loading = false;
    errorMessage = '';
    sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' = 'date-desc';

    categories = [
        'Salario',
        'Freelance',
        'Vendas',
        'Aluguel',
        'Dividendos',
        'Reembolso',
        'Alimentacao',
        'Transporte',
        'Saude',
        'Educacao',
        'Lazer',
        'Utilidades',
        'Outros',
    ];

    transactionTypes = [
        { value: 'income', label: 'Ganhos' },
        { value: 'expense', label: 'Gastos' },
        { value: 'investment_in', label: 'Investimento - Entrada' },
        { value: 'investment_out', label: 'Investimento - Saída' },
        { value: 'investment_return', label: 'Investimento - Retorno' },
    ];

    filters: FilterOptions = {
        searchText: '',
        dateFrom: '',
        dateTo: '',
        category: '',
        type: '',
        minAmount: null,
        maxAmount: null,
    };

    stats = {
        totalTransactions: 0,
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
    };

    constructor(private service: TransactionService) { }

    ngOnInit() {
        this.loadTransactions();
    }

    async loadTransactions() {
        this.loading = true;
        this.errorMessage = '';
        try {
            this.allTransactions = await this.service.getAll();
            this.applyFilters();
            this.updateStats();
        } catch {
            this.errorMessage = 'Não foi possível carregar as movimentações.';
        } finally {
            this.loading = false;
        }
    }

    applyFilters() {
        let filtered = [...this.allTransactions];

        // Filtro por texto de busca
        if (this.filters.searchText.trim()) {
            const search = this.filters.searchText.toLowerCase();
            filtered = filtered.filter(
                (t) =>
                    t.description.toLowerCase().includes(search) ||
                    t.category?.toLowerCase().includes(search) ||
                    t.account?.toLowerCase().includes(search) ||
                    t.notes?.toLowerCase().includes(search)
            );
        }

        // Filtro por data
        if (this.filters.dateFrom) {
            const dateFrom = new Date(this.filters.dateFrom);
            filtered = filtered.filter((t) => new Date(t.date) >= dateFrom);
        }

        if (this.filters.dateTo) {
            const dateTo = new Date(this.filters.dateTo);
            dateTo.setHours(23, 59, 59, 999);
            filtered = filtered.filter((t) => new Date(t.date) <= dateTo);
        }

        // Filtro por categoria
        if (this.filters.category) {
            filtered = filtered.filter((t) => t.category === this.filters.category);
        }

        // Filtro por tipo
        if (this.filters.type) {
            filtered = filtered.filter((t) => (t.type ?? 'income') === this.filters.type);
        }

        // Filtro por valor mínimo
        if (this.filters.minAmount !== null && this.filters.minAmount > 0) {
            filtered = filtered.filter((t) => Math.abs(t.amount) >= this.filters.minAmount!);
        }

        // Filtro por valor máximo
        if (this.filters.maxAmount !== null && this.filters.maxAmount > 0) {
            filtered = filtered.filter((t) => Math.abs(t.amount) <= this.filters.maxAmount!);
        }

        // Aplicar ordenação
        this.sortTransactions(filtered);
        this.filteredTransactions = filtered;
    }

    sortTransactions(transactions: Transaction[]) {
        switch (this.sortBy) {
            case 'date-desc':
                transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                break;
            case 'date-asc':
                transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                break;
            case 'amount-desc':
                transactions.sort((a, b) => b.amount - a.amount);
                break;
            case 'amount-asc':
                transactions.sort((a, b) => a.amount - b.amount);
                break;
        }
    }

    updateStats() {
        this.stats.totalTransactions = this.filteredTransactions.length;
        this.stats.totalIncome = this.filteredTransactions
            .filter((t) => (t.type ?? 'income') === 'income' || (t.type ?? 'income') === 'investment_return')
            .reduce((sum, t) => sum + t.amount, 0);

        this.stats.totalExpense = this.filteredTransactions
            .filter((t) => (t.type ?? 'income') === 'expense' || (t.type ?? 'income') === 'investment_out')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        this.stats.netBalance = this.stats.totalIncome - this.stats.totalExpense;
    }

    onSortChange() {
        this.sortTransactions(this.filteredTransactions);
    }

    resetFilters() {
        this.filters = {
            searchText: '',
            dateFrom: '',
            dateTo: '',
            category: '',
            type: '',
            minAmount: null,
            maxAmount: null,
        };
        this.applyFilters();
        this.updateStats();
    }

    getTypeLabel(type?: string): string {
        const found = this.transactionTypes.find((t) => t.value === (type ?? 'income'));
        return found ? found.label : 'Sem tipo';
    }

    getTypeColor(type?: string): string {
        const typeValue = type ?? 'income';
        if (typeValue === 'income' || typeValue === 'investment_return') return 'positive';
        if (typeValue === 'expense' || typeValue === 'investment_out') return 'negative';
        if (typeValue === 'investment_in') return 'neutral';
        return 'neutral';
    }

    getAmount(transaction: Transaction): string {
        const type = transaction.type ?? 'income';
        if (type === 'income' || type === 'investment_return') {
            return `+${transaction.amount.toFixed(2)}`;
        }
        return `-${Math.abs(transaction.amount).toFixed(2)}`;
    }

    async deleteTransaction(id: string) {
        if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
            try {
                await this.service.remove(id);
                await this.loadTransactions();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Erro desconhecido';
                this.errorMessage = `Não foi possível excluir a movimentação. ${message}`;
            }
        }
    }

    exportToCSV() {
        if (this.filteredTransactions.length === 0) {
            alert('Nenhuma movimentação para exportar');
            return;
        }

        const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Conta'];
        const rows = this.filteredTransactions.map((t) => [
            t.date,
            t.description,
            t.category || '',
            this.getTypeLabel(t.type),
            this.getAmount(t),
            t.account || '',
        ]);

        const csv = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `movimentacoes-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    get hasActiveFilters(): boolean {
        return !!(
            this.filters.searchText ||
            this.filters.dateFrom ||
            this.filters.dateTo ||
            this.filters.category ||
            this.filters.type ||
            (this.filters.minAmount !== null && this.filters.minAmount > 0) ||
            (this.filters.maxAmount !== null && this.filters.maxAmount > 0)
        );
    }
}
