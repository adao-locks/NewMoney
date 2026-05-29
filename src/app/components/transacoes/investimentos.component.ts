import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, emptySummary, FinancialSummary } from '../../services/transaction.service';
import { InvestmentMovement } from '../../models/transaction.model';

@Component({
    selector: 'app-transacoes-investimentos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './investimentos.component.html',
    styleUrls: ['./investimentos.component.css'],
})
export class TransacoesInvestimentosComponent implements OnInit {
    items: InvestmentMovement[] = [];
    totals: FinancialSummary = emptySummary();
    editingId: string | null = null;
    loading = false;
    errorMessage = '';

    form: Partial<InvestmentMovement> = this.getEmptyForm();

    movementTypes = [
        { value: 'investment_in', label: 'Entrada / Aporte' },
        { value: 'investment_out', label: 'Saída / Resgate' },
        { value: 'investment_return', label: 'Rendimento' },
    ];

    assetClasses = ['Renda fixa', 'Ações', 'Fundos', 'FIIs', 'Cripto', 'Previdência', 'Exterior', 'Outros'];

    constructor(private service: TransactionService) { }

    ngOnInit() {
        this.loadData();
    }

    get isEditing() {
        return !!this.editingId;
    }

    async loadData() {
        this.loading = true;
        this.errorMessage = '';

        try {
            [this.items, this.totals] = await Promise.all([
                this.service.getInvestmentMovements(),
                this.service.getSummary(),
            ]);
        } catch {
            this.errorMessage = 'Nao foi possivel carregar os investimentos.';
        } finally {
            this.loading = false;
        }
    }

    async save() {
        if (!this.form.description || !this.form.date || !this.form.amount || !this.form.investmentName || !this.form.type) {
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        const normalizedAmount = Math.abs(Number(this.form.amount));
        const signedAmount = this.form.type === 'investment_out' ? -normalizedAmount : normalizedAmount;
        const payload: Omit<InvestmentMovement, 'id'> = {
            date: this.form.date!,
            description: this.form.description!,
            amount: signedAmount,
            type: this.form.type,
            investmentName: this.form.investmentName!,
            institution: this.form.institution,
            assetClass: this.form.assetClass,
            quantity: Number(this.form.quantity || 0),
            unitPrice: Number(this.form.unitPrice || 0),
            brokerFee: Number(this.form.brokerFee || 0),
            notes: this.form.notes,
        };

        try {
            if (this.editingId) {
                await this.service.update(this.editingId, payload);
            } else {
                await this.service.add(payload);
            }
            this.resetForm();
            await this.loadData();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            this.errorMessage = `Nao foi possivel salvar o movimento. ${message}`;
        } finally {
            this.loading = false;
        }
    }

    edit(item: InvestmentMovement) {
        this.editingId = item.id;
        this.form = { ...item, amount: Math.abs(item.amount) };
    }

    async remove(id: string) {
        this.loading = true;
        this.errorMessage = '';

        try {
            await this.service.remove(id);
            if (this.editingId === id) {
                this.resetForm();
            }
            await this.loadData();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            this.errorMessage = `Nao foi possivel excluir o movimento. ${message}`;
        } finally {
            this.loading = false;
        }
    }

    resetForm() {
        this.editingId = null;
        this.form = this.getEmptyForm();
    }

    typeLabel(type = '') {
        return this.movementTypes.find((item) => item.value === type)?.label ?? 'Movimento';
    }

    private getEmptyForm(): Partial<InvestmentMovement> {
        return {
            date: new Date().toISOString().substring(0, 10),
            description: '',
            amount: 0,
            type: 'investment_in',
            investmentName: '',
            institution: '',
            assetClass: 'Renda fixa',
            quantity: 0,
            unitPrice: 0,
            brokerFee: 0,
            notes: '',
        };
    }
}
