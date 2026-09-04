import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Transaction } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction.service';

type ExpenseRecurrenceMode = 'single' | 'subscription' | 'installment';

interface ExpenseForm extends Partial<Transaction> {
  recurrenceMode: ExpenseRecurrenceMode;
  installments: number;
}

@Component({
  selector: 'app-transacoes-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gastos.component.html',
  styleUrls: ['./gastos.component.css'],
})
export class TransacoesGastosComponent implements OnInit {
  editingId: string | null = null;
  items: Transaction[] = [];
  loading = false;
  errorMessage = '';
  form: ExpenseForm = this.getEmptyForm();

  categories = ['Moradia', 'Alimentacao', 'Transporte', 'Saude', 'Educacao', 'Lazer', 'Dividas', 'Impostos', 'Outros'];

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
      this.items = allItems.filter((item) => (item.type ?? 'expense') === 'expense');
    } catch {
      this.errorMessage = 'Nao foi possivel carregar seus gastos.';
    } finally {
      this.loading = false;
    }
  }

  async save() {
    if (!this.form.description || !this.form.date || !this.form.amount) {
      return;
    }

    try {
      if (this.editingId) {
        await this.service.update(
          this.editingId,
          this.buildBaseExpense(this.form.date, this.form.description, { recurrence: this.form.recurrence }),
        );
      } else {
        await this.addExpenseByRecurrenceMode();
      }
      this.resetForm();
      await this.loadItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      this.errorMessage = `Nao foi possivel salvar o gasto. ${message}`;
    }
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
      this.errorMessage = `Nao foi possivel excluir o gasto. ${message}`;
    }
  }

  edit(item: Transaction) {
    this.editingId = item.id;
    this.form = {
      ...item,
      amount: Math.abs(item.amount),
      recurrenceMode: item.recurrence?.kind ?? 'single',
      installments: item.recurrence?.installmentTotal ?? 2,
    };
  }

  resetForm() {
    this.editingId = null;
    this.form = this.getEmptyForm();
  }

  getRecurrenceLabel(item: Transaction) {
    if (item.recurrence?.kind === 'subscription') {
      return 'Assinatura recorrente';
    }

    if (item.recurrence?.kind === 'installment') {
      return `Parcela ${item.recurrence.installmentNumber}/${item.recurrence.installmentTotal}`;
    }

    return '';
  }

  private async addExpenseByRecurrenceMode() {
    const mode = this.form.recurrenceMode;

    if (mode === 'installment') {
      const total = Math.max(2, Number(this.form.installments || 2));
      const seriesId = this.createSeriesId();
      const expenses = Array.from({ length: total }, (_, index) => {
        const date = this.addMonths(this.form.date!, index);
        const installmentNumber = index + 1;

        return this.buildBaseExpense(date, `${this.form.description} (${installmentNumber}/${total})`, {
          recurrence: {
            kind: 'installment',
            frequency: 'monthly',
            status: installmentNumber === total ? 'completed' : 'active',
            startsAt: this.form.date!,
            endsAt: this.addMonths(this.form.date!, total - 1),
            seriesId,
            installmentNumber,
            installmentTotal: total,
          },
        });
      });

      await this.service.addMany(expenses);
      return;
    }

    const recurrence = mode === 'subscription'
      ? {
        recurrence: {
          kind: 'subscription' as const,
          frequency: 'monthly' as const,
          status: 'active' as const,
          startsAt: this.form.date!,
          seriesId: this.createSeriesId(),
        },
      }
      : {};

    await this.service.add(this.buildBaseExpense(this.form.date!, this.form.description!, recurrence));
  }

  private buildBaseExpense(
    date: string,
    description: string,
    extra: Partial<Omit<Transaction, 'id'>> = {},
  ): Omit<Transaction, 'id'> {
    return {
      date,
      description,
      amount: -Math.abs(Number(this.form.amount)),
      type: 'expense',
      category: this.form.category,
      account: this.form.account,
      notes: this.form.notes,
      ...extra,
    };
  }

  private addMonths(dateValue: string, months: number) {
    const [year, month, day] = dateValue.split('-').map(Number);
    const target = new Date(year, month - 1 + months, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(day, lastDay));

    const targetYear = target.getFullYear();
    const targetMonth = String(target.getMonth() + 1).padStart(2, '0');
    const targetDay = String(target.getDate()).padStart(2, '0');

    return `${targetYear}-${targetMonth}-${targetDay}`;
  }

  private createSeriesId() {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private getEmptyForm(): ExpenseForm {
    return {
      date: new Date().toISOString().substring(0, 10),
      description: '',
      amount: 0,
      category: 'Moradia',
      account: '',
      notes: '',
      recurrenceMode: 'single',
      installments: 2,
    };
  }
}
