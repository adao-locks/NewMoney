import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';

@Component({
    selector: 'app-transacoes-ganhos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ganhos.component.html',
    styleUrls: ['./ganhos.component.css'],
})
export class TransacoesGanhosComponent {
    service = new TransactionService();
    editingId: string | null = null;
    form: Partial<Transaction> = {
        date: new Date().toISOString().substring(0, 10),
        description: '',
        amount: 0,
        category: 'Salário',
        account: '',
        notes: '',
    };

    categories = ['Salário', 'Freelance', 'Vendas', 'Aluguel', 'Dividendos', 'Reembolso', 'Outros'];

    get items() {
        return this.service.getAll().filter((t) => (t.type ?? 'income') === 'income');
    }

    get isEditing() {
        return !!this.editingId;
    }

    save() {
        if (!this.form.description || !this.form.date || !this.form.amount) {
            return;
        }

        const payload: Omit<Transaction, 'id'> = {
            date: this.form.date!,
            description: this.form.description!,
            amount: Math.abs(Number(this.form.amount)),
            type: 'income',
            category: this.form.category,
            account: this.form.account,
            notes: this.form.notes,
        };

        if (this.editingId) {
            this.service.update(this.editingId, payload);
        } else {
            this.service.add(payload);
        }

        this.resetForm();
    }

    edit(item: Transaction) {
        this.editingId = item.id;
        this.form = { ...item };
    }

    remove(id: string) {
        this.service.remove(id);
        if (this.editingId === id) {
            this.resetForm();
        }
    }

    resetForm() {
        this.editingId = null;
        this.form = {
            date: new Date().toISOString().substring(0, 10),
            description: '',
            amount: 0,
            category: 'Salário',
            account: '',
            notes: '',
        };
    }
}
