import { Injectable } from '@angular/core';
import {
  CollectionReference,
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { AuthService } from './auth.service';
import { firebaseDb } from '../firebase';
import { InvestmentMovement, PersonalAsset, Transaction } from '../models/transaction.model';

export interface FinancialSummary {
  ganhos: number;
  gastos: number;
  gastosTotal: number;
  balance: number;
  aportes: number;
  resgates: number;
  rendimentos: number;
  posicaoInvestimentos: number;
  patrimonioBens: number;
  valorizacaoBens: number;
  patrimonioTotal: number;
}

export const emptySummary = (): FinancialSummary => ({
  ganhos: 0,
  gastos: 0,
  gastosTotal: 0,
  balance: 0,
  aportes: 0,
  resgates: 0,
  rendimentos: 0,
  posicaoInvestimentos: 0,
  patrimonioBens: 0,
  valorizacaoBens: 0,
  patrimonioTotal: 0,
});

export type DataDeleteKind = 'incomes' | 'expenses' | 'investments' | 'assets' | 'all';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  constructor(private auth: AuthService) { }

  private async requireUser() {
    const user = this.auth.currentUser ?? await this.auth.authReady;
    if (!user) {
      throw new Error('Usuario nao autenticado.');
    }
    return user;
  }

  private async userCollection(name: 'transactions' | 'assets') {
    const user = await this.requireUser();
    return collection(firebaseDb, 'users', user.uid, name) as CollectionReference<DocumentData>;
  }

  private async userDoc(name: 'transactions' | 'assets', id: string) {
    const user = await this.requireUser();
    return doc(firebaseDb, 'users', user.uid, name, id);
  }

  private clean<T extends Record<string, unknown>>(data: T) {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    ) as T;
  }

  private transactionFromDoc(snapshot: DocumentSnapshot<DocumentData>): Transaction {
    const data = snapshot.data() as Omit<Transaction, 'id'>;
    return {
      ...data,
      id: snapshot.id,
      type: data.type ?? (data.amount >= 0 ? 'income' : 'expense'),
    };
  }

  private assetFromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): PersonalAsset {
    return {
      ...(snapshot.data() as Omit<PersonalAsset, 'id'>),
      id: snapshot.id,
    };
  }

  async getAll(): Promise<Transaction[]> {
    const transactions = await this.userCollection('transactions');
    const snapshot = await getDocs(query(transactions, orderBy('date', 'desc')));
    return snapshot.docs.map((item) => this.transactionFromDoc(item));
  }

  async getById(id: string) {
    const transaction = await this.userDoc('transactions', id);
    const snapshot = await getDoc(transaction);
    if (!snapshot.exists()) {
      return null;
    }
    return this.transactionFromDoc(snapshot as QueryDocumentSnapshot<DocumentData>);
  }

  async add(tx: Omit<Transaction, 'id'>) {
    const payload = this.clean({
      ...tx,
      type: tx.type ?? (tx.amount >= 0 ? 'income' : 'expense'),
    });
    const transactions = await this.userCollection('transactions');
    const reference = await addDoc(transactions, payload);
    return { ...payload, id: reference.id } as Transaction;
  }

  async update(id: string, tx: Omit<Transaction, 'id'>) {
    const transaction = await this.userDoc('transactions', id);
    await updateDoc(transaction, this.clean({ ...tx }));
    return { ...tx, id } as Transaction;
  }

  async remove(id: string) {
    const transaction = await this.userDoc('transactions', id);
    await deleteDoc(transaction);
  }

  async getInvestmentMovements(): Promise<InvestmentMovement[]> {
    const allItems = await this.getAll();
    return allItems.filter((item) =>
      item.type === 'investment_in' || item.type === 'investment_out' || item.type === 'investment_return'
    ) as InvestmentMovement[];
  }

  async getAssets(): Promise<PersonalAsset[]> {
    const assets = await this.userCollection('assets');
    const snapshot = await getDocs(query(assets, orderBy('name', 'asc')));
    return snapshot.docs.map((item) => this.assetFromDoc(item));
  }

  async addAsset(asset: Omit<PersonalAsset, 'id'>) {
    const payload = this.clean({ ...asset });
    const assets = await this.userCollection('assets');
    const reference = await addDoc(assets, payload);
    return { ...payload, id: reference.id } as PersonalAsset;
  }

  async updateAsset(id: string, asset: Omit<PersonalAsset, 'id'>) {
    const assetDoc = await this.userDoc('assets', id);
    await updateDoc(assetDoc, this.clean({ ...asset }));
    return { ...asset, id } as PersonalAsset;
  }

  async removeAsset(id: string) {
    const assetDoc = await this.userDoc('assets', id);
    await deleteDoc(assetDoc);
  }

  async deleteUserData(kind: DataDeleteKind) {
    if (kind === 'assets') {
      return this.deleteAssets();
    }

    if (kind === 'all') {
      const [transactionsCount, assetsCount] = await Promise.all([
        this.deleteTransactionsByKind('all'),
        this.deleteAssets(),
      ]);
      return transactionsCount + assetsCount;
    }

    return this.deleteTransactionsByKind(kind);
  }

  private async deleteTransactionsByKind(kind: Exclude<DataDeleteKind, 'assets'>) {
    const transactions = await this.userCollection('transactions');
    const snapshot = await getDocs(query(transactions));
    const docs = kind === 'all'
      ? snapshot.docs
      : snapshot.docs.filter((item) => this.shouldDeleteTransaction(item, kind));

    await this.deleteSnapshotsInBatches(docs);
    return docs.length;
  }

  private async deleteAssets() {
    const assets = await this.userCollection('assets');
    const snapshot = await getDocs(query(assets));

    await this.deleteSnapshotsInBatches(snapshot.docs);
    return snapshot.size;
  }

  private shouldDeleteTransaction(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    kind: Exclude<DataDeleteKind, 'assets' | 'all'>,
  ) {
    const data = snapshot.data() as Partial<Transaction>;
    const type = data.type ?? (Number(data.amount ?? 0) >= 0 ? 'income' : 'expense');
    return this.transactionTypesForDelete(kind).includes(type);
  }

  private transactionTypesForDelete(kind: Exclude<DataDeleteKind, 'assets' | 'all'>) {
    if (kind === 'incomes') {
      return ['income'];
    }

    if (kind === 'expenses') {
      return ['expense'];
    }

    return ['investment_in', 'investment_out', 'investment_return'];
  }

  private async deleteSnapshotsInBatches(snapshots: QueryDocumentSnapshot<DocumentData>[]) {
    for (let index = 0; index < snapshots.length; index += 500) {
      const batch = writeBatch(firebaseDb);
      snapshots.slice(index, index + 500).forEach((snapshot) => batch.delete(snapshot.ref));
      await batch.commit();
    }
  }

  async getSummary() {
    const [transactions, assets] = await Promise.all([this.getAll(), this.getAssets()]);
    return this.calculateSummary(transactions, assets);
  }

  calculateSummary(items: Transaction[], assets: PersonalAsset[]): FinancialSummary {
    const ganhos = items
      .filter((item) => (item.type ?? 'income') === 'income')
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);
    const gastos = items
      .filter((item) => (item.type ?? 'expense') === 'expense')
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);
    const aportes = items
      .filter((item) => item.type === 'investment_in')
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);
    const resgates = items
      .filter((item) => item.type === 'investment_out')
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);
    const rendimentos = items
      .filter((item) => item.type === 'investment_return')
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);
    const patrimonioBens = assets
      .filter((item) => item.status !== 'vendido')
      .reduce((sum, item) => sum + Number(item.currentValue || 0), 0);
    const custoBens = assets
      .filter((item) => item.status !== 'vendido')
      .reduce((sum, item) => sum + Number(item.acquisitionValue || 0), 0);
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
