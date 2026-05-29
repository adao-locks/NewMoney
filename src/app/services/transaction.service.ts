import { InvestmentMovement, PersonalAsset, Transaction } from '../models/transaction.model';
import { firebaseAuth } from '../firebase';

const STORAGE_KEY = 'desk_transactions_v1';
const ASSETS_STORAGE_KEY = 'desk_assets_v1';

export class TransactionService {
  private items: Transaction[] = [];
  private assets: PersonalAsset[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const storageKey = this.getStorageKey(STORAGE_KEY);
      this.migrateLegacyData(STORAGE_KEY, storageKey);
      const raw = localStorage.getItem(storageKey);
      this.items = (raw ? JSON.parse(raw) : []).map((item: Transaction) => ({
        ...item,
        type: item.type ?? (item.amount >= 0 ? 'income' : 'expense'),
      }));
    } catch (e) {
      this.items = [];
    }

    try {
      const assetsStorageKey = this.getStorageKey(ASSETS_STORAGE_KEY);
      this.migrateLegacyData(ASSETS_STORAGE_KEY, assetsStorageKey);
      const rawAssets = localStorage.getItem(assetsStorageKey);
      this.assets = rawAssets ? JSON.parse(rawAssets) : [];
    } catch (e) {
      this.assets = [];
    }
  }

  private save() {
    localStorage.setItem(this.getStorageKey(STORAGE_KEY), JSON.stringify(this.items));
  }

  private saveAssets() {
    localStorage.setItem(this.getStorageKey(ASSETS_STORAGE_KEY), JSON.stringify(this.assets));
  }

  private getStorageKey(key: string) {
    const uid = firebaseAuth.currentUser?.uid;
    return uid ? `${key}_${uid}` : key;
  }

  private migrateLegacyData(key: string, userKey: string) {
    if (key === userKey || localStorage.getItem(userKey)) {
      return;
    }

    const legacy = localStorage.getItem(key);
    if (legacy) {
      localStorage.setItem(userKey, legacy);
    }
  }

  getAll(): Transaction[] {
    return [...this.items].sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  getById(id: string) {
    return this.items.find((i) => i.id === id) ?? null;
  }

  add(tx: Omit<Transaction, 'id'>) {
    const item: Transaction = {
      ...tx,
      type: tx.type ?? (tx.amount >= 0 ? 'income' : 'expense'),
      id: crypto?.randomUUID?.() ?? Date.now().toString(),
    };
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

  getInvestmentMovements(): InvestmentMovement[] {
    return this.getAll().filter((i) =>
      i.type === 'investment_in' || i.type === 'investment_out' || i.type === 'investment_return'
    ) as InvestmentMovement[];
  }

  getAssets(): PersonalAsset[] {
    return [...this.assets].sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  addAsset(asset: Omit<PersonalAsset, 'id'>) {
    const item: PersonalAsset = { ...asset, id: crypto?.randomUUID?.() ?? Date.now().toString() };
    this.assets.push(item);
    this.saveAssets();
    return item;
  }

  updateAsset(id: string, asset: Omit<PersonalAsset, 'id'>) {
    const index = this.assets.findIndex((i) => i.id === id);
    if (index === -1) {
      return null;
    }
    this.assets[index] = { ...this.assets[index], ...asset };
    this.saveAssets();
    return this.assets[index];
  }

  removeAsset(id: string) {
    this.assets = this.assets.filter((i) => i.id !== id);
    this.saveAssets();
  }

  getSummary() {
    const ganhos = this.items
      .filter((i) => (i.type ?? 'income') === 'income')
      .reduce((s, i) => s + Math.abs(i.amount), 0);
    const gastos = this.items
      .filter((i) => (i.type ?? 'expense') === 'expense')
      .reduce((s, i) => s + Math.abs(i.amount), 0);
    const aportes = this.items
      .filter((i) => i.type === 'investment_in')
      .reduce((s, i) => s + Math.abs(i.amount), 0);
    const resgates = this.items
      .filter((i) => i.type === 'investment_out')
      .reduce((s, i) => s + Math.abs(i.amount), 0);
    const rendimentos = this.items
      .filter((i) => i.type === 'investment_return')
      .reduce((s, i) => s + Math.abs(i.amount), 0);
    const patrimonioBens = this.assets
      .filter((i) => i.status !== 'vendido')
      .reduce((s, i) => s + Number(i.currentValue || 0), 0);
    const custoBens = this.assets
      .filter((i) => i.status !== 'vendido')
      .reduce((s, i) => s + Number(i.acquisitionValue || 0), 0);
    const posicaoInvestimentos = aportes - resgates + rendimentos;
    const fluxoCaixa = ganhos - gastos - aportes + resgates + rendimentos;
    const patrimonioTotal = fluxoCaixa + posicaoInvestimentos + patrimonioBens;

    return {
      ganhos,
      gastos: -gastos,
      gastosTotal: gastos,
      balance: fluxoCaixa,
      aportes,
      resgates,
      rendimentos,
      posicaoInvestimentos,
      patrimonioBens,
      valorizacaoBens: patrimonioBens - custoBens,
      patrimonioTotal,
    };
  }
}
