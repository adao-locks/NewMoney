import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Transaction } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction.service';

@Component({
    selector: 'app-transacoes-ganhos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ganhos.component.html',
    styleUrls: ['./ganhos.component.css'],
})
export class TransacoesGanhosComponent implements OnInit {
    editingId: string | null = null;
    items: Transaction[] = [];
    loading = false;
    errorMessage = '';
    form: Partial<Transaction> = this.getEmptyForm();

    categories = ['Salario', 'Freelance', 'Vendas', 'Aluguel', 'Dividendos', 'Reembolso', 'Outros'];

    constructor(private service: TransactionService) { }

    ngOnInit() {
        this.loadItems();
    }

    get isEditing() {
        return !!this.editingId;
    }

    async loadItems() {
        this.loading = true;
        this.errorMessage = '';
        try {
            const allItems = await this.service.getAll();
            this.items = allItems.filter((item) => (item.type ?? 'income') === 'income');
        } catch {
            this.errorMessage = 'Nao foi possivel carregar seus ganhos.';
        } finally {
            this.loading = false;
        }
    }

    async save() {
        if (!this.form.description || !this.form.date || !this.form.amount) {
            return;
        }

        const payload: Omit<Transaction, 'id'> = {
            date: this.form.date,
            description: this.form.description,
            amount: Math.abs(Number(this.form.amount)),
            type: 'income',
            category: this.form.category,
            account: this.form.account,
            notes: this.form.notes,
        };

        try {
            if (this.editingId) {
                await this.service.update(this.editingId, payload);
            } else {
                await this.service.add(payload);
            }
            this.resetForm();
            await this.loadItems();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            this.errorMessage = `Nao foi possivel salvar o ganho. ${message}`;
        }
    }

    edit(item: Transaction) {
        this.editingId = item.id;
        this.form = { ...item };
    }

    async remove(id: string) {
        try {
            await this.service.remove(id);
            if (this.editingId === id) {
                this.resetForm();
            }
            await this.loadItems();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            this.errorMessage = `Nao foi possivel excluir o ganho. ${message}`;
        }
    }

    resetForm() {
        this.editingId = null;
        this.form = this.getEmptyForm();
    }

    private getEmptyForm(): Partial<Transaction> {
        return {
            date: new Date().toISOString().substring(0, 10),
            description: '',
            amount: 0,
            category: 'Salario',
            account: '',
            notes: '',
        };
    }
}
