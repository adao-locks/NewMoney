import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';

@Component({
    selector: 'app-transacoes-gastos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './gastos.component.html',
    styleUrls: ['./gastos.component.css'],
})
export class TransacoesGastosComponent {
    service = new TransactionService();
    editingId: string | null = null;
    form: Partial<Transaction> = {
        date: new Date().toISOString().substring(0, 10),
        description: '',
        amount: 0,
    };

    get items() {
        return this.service.getAll().filter((t) => t.amount < 0);
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
            amount: -Math.abs(Number(this.form.amount)),
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
        this.form = { ...item, amount: Math.abs(item.amount) };
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
        };
    }
}
