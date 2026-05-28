import { Transaction } from '../models/transaction.model';

const STORAGE_KEY = 'desk_transactions_v1';

export class TransactionService {
  private items: Transaction[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.items = raw ? JSON.parse(raw) : [];
    } catch (e) {
      this.items = [];
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
  }

  getAll(): Transaction[] {
    return [...this.items].sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  getById(id: string) {
    return this.items.find((i) => i.id === id) ?? null;
  }

  add(tx: Omit<Transaction, 'id'>) {
    const item: Transaction = { ...tx, id: crypto?.randomUUID?.() ?? Date.now().toString() };
    this.items.push(item);
    this.save();
    return item;
  }

  update(id: string, tx: Omit<Transaction, 'id'>) {
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      return null;
    }
    this.items[index] = { ...this.items[index], ...tx };
    this.save();
    return this.items[index];
  }

  remove(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
    this.save();
  }

  getSummary() {
    const ganhos = this.items.filter((i) => i.amount > 0).reduce((s, i) => s + i.amount, 0);
    const gastos = this.items.filter((i) => i.amount < 0).reduce((s, i) => s + i.amount, 0);
    const balance = ganhos + gastos;
    return { ganhos, gastos, balance };
  }
}
