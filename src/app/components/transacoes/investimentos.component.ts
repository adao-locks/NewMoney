import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, emptySummary, FinancialSummary } from '../../services/transaction.service';
import { InvestmentMovement } from '../../models/transaction.model';
import { LimitToPipe } from "../../limit-to-pipe";

type InvestmentMovementType = InvestmentMovement['type'];

interface InvestmentPosition {
  name: string;
  institution: string;
  assetClass: string;
  invested: number;
  redeemed: number;
  returns: number;
  currentValue: number;
  quantity: number;
  lastDate: string;
}

@Component({
  selector: 'app-transacoes-investimentos',
  standalone: true,
  imports: [CommonModule, FormsModule, LimitToPipe],
  templateUrl: './investimentos.component.html',
  styleUrls: ['./investimentos.component.css'],
})
export class TransacoesInvestimentosComponent implements OnInit {
  items: InvestmentMovement[] = [];
  positions: InvestmentPosition[] = [];
  knownInvestmentNames: string[] = [];
  selectedPosition: InvestmentPosition | null = null;
  totals: FinancialSummary = emptySummary();
  editingId: string | null = null;
  loading = false;
  errorMessage = '';
  returnPercent: number | null = null;

  form: Partial<InvestmentMovement> = this.getEmptyForm();

  movementTypes = [
    { value: 'investment_in' as InvestmentMovementType, label: 'Entrada / Aporte', hint: 'Compra, aplicação ou reforço de posição' },
    { value: 'investment_return' as InvestmentMovementType, label: 'Rendimento', hint: 'Juros, dividendos, proventos ou valorização informada' },
    { value: 'investment_out' as InvestmentMovementType, label: 'Resgate / Saída', hint: 'Venda, saque, vencimento ou redução de posição' },
  ];

  assetClasses = ['Renda fixa', 'CDI', 'Tesouro', 'Ações', 'Fundos', 'FIIs', 'Cripto', 'Previdência', 'Exterior', 'Outros'];

  assetInstitutions: string[] = [];

  constructor(private service: TransactionService) { }

  ngOnInit() {
    this.loadData();
  }

  get isEditing() {
    return !!this.editingId;
  }

  get currentType() {
    return this.form.type ?? 'investment_in';
  }

  async loadData() {
    this.loading = true;
    this.errorMessage = '';

    try {
      const [items, totals, institutions] = await Promise.all([
        this.service.getInvestmentMovements(),
        this.service.getSummary(),
        this.service.getInstitutions(),
      ]);
      this.items = items;
      this.totals = totals;
      this.assetInstitutions = institutions.map((institution) => institution.name);
      this.refreshDerivedData();
    } catch {
      this.errorMessage = 'Nao foi possivel carregar os investimentos.';
    } finally {
      this.loading = false;
    }
  }

  async save() {
    this.syncDescription();

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
      quantity: this.currentType === 'investment_return' ? 0 : Number(this.form.quantity || 0),
      unitPrice: this.currentType === 'investment_return' ? 0 : Number(this.form.unitPrice || 0),
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
    this.returnPercent = null;
    this.form = { ...item, amount: Math.abs(item.amount) };
    this.refreshSelectedPosition();
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
    this.returnPercent = null;
    this.form = this.getEmptyForm();
    this.selectedPosition = null;
  }

  typeLabel(type = '') {
    return this.movementTypes.find((item) => item.value === type)?.label ?? 'Movimento';
  }

  setType(type: InvestmentMovementType) {
    this.form.type = type;
    this.returnPercent = null;

    if (type === 'investment_return') {
      this.form.quantity = 0;
      this.form.unitPrice = 0;
      this.form.brokerFee = 0;
    }

    this.applyKnownInvestmentData();
    this.syncAmountFromPricing();
    this.syncDescription(true);
    this.refreshSelectedPosition();
  }

  selectPosition(position: InvestmentPosition) {
    this.form.investmentName = position.name;
    this.form.institution = position.institution;
    this.form.assetClass = position.assetClass;
    this.selectedPosition = position;
    this.syncDescription(true);
    this.syncReturnFromPercent();
  }

  applyKnownInvestmentData() {
    const name = this.normalizeName(this.form.investmentName);
    const latest = this.items.find((item) => this.normalizeName(item.investmentName) === name);
    this.refreshSelectedPosition();

    if (!latest) {
      this.syncDescription();
      return;
    }

    this.form.institution = this.form.institution || latest.institution;
    this.form.assetClass = this.form.assetClass || latest.assetClass;
    this.syncDescription();
  }

  syncAmountFromPricing() {
    if (this.currentType === 'investment_return') {
      return;
    }

    const quantity = Number(this.form.quantity || 0);
    const unitPrice = Number(this.form.unitPrice || 0);
    const brokerFee = Number(this.form.brokerFee || 0);

    if (quantity <= 0 || unitPrice <= 0) {
      return;
    }

    const grossAmount = quantity * unitPrice;
    this.form.amount = this.currentType === 'investment_out'
      ? Math.max(grossAmount - brokerFee, 0)
      : grossAmount + brokerFee;
  }

  syncReturnFromPercent() {
    if (this.currentType !== 'investment_return' || !this.returnPercent || !this.selectedPosition) {
      return;
    }

    this.form.amount = Number((this.selectedPosition.currentValue * (this.returnPercent / 100)).toFixed(2));
    this.syncDescription(true);
  }

  isActiveType(type: InvestmentMovementType) {
    return this.currentType === type;
  }

  trackByItemId(_: number, item: InvestmentMovement) {
    return item.id;
  }

  trackByPositionName(_: number, position: InvestmentPosition) {
    return position.name;
  }

  trackByMovementType(_: number, option: { value: InvestmentMovementType }) {
    return option.value;
  }

  trackByValue(_: number, value: string) {
    return value;
  }

  private refreshDerivedData() {
    this.positions = this.buildPositions(this.items);
    this.knownInvestmentNames = [...new Set(this.items.map((item) => item.investmentName).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    this.refreshSelectedPosition();
  }

  private refreshSelectedPosition() {
    const name = this.normalizeName(this.form.investmentName);
    this.selectedPosition = this.positions.find((item) => this.normalizeName(item.name) === name) ?? null;
  }

  private syncDescription(force = false) {
    if (!force && this.form.description) {
      return;
    }

    const investmentName = this.form.investmentName?.trim();
    if (!investmentName) {
      return;
    }

    const label = this.typeLabel(this.currentType).split('/')[0].trim();
    this.form.description = `${label} - ${investmentName}`;
  }

  private buildPositions(items: InvestmentMovement[]): InvestmentPosition[] {
    const positions = new Map<string, InvestmentPosition>();

    for (const item of items) {
      const key = this.normalizeName(item.investmentName);
      if (!key) {
        continue;
      }

      const position = positions.get(key) ?? {
        name: item.investmentName,
        institution: item.institution ?? '',
        assetClass: item.assetClass ?? 'Outros',
        invested: 0,
        redeemed: 0,
        returns: 0,
        currentValue: 0,
        quantity: 0,
        lastDate: item.date,
      };

      const amount = Math.abs(Number(item.amount || 0));
      const quantity = Number(item.quantity || 0);

      if (item.type === 'investment_in') {
        position.invested += amount;
        position.currentValue += amount;
        position.quantity += quantity;
      }

      if (item.type === 'investment_out') {
        position.redeemed += amount;
        position.currentValue -= amount;
        position.quantity -= quantity;
      }

      if (item.type === 'investment_return') {
        position.returns += amount;
        position.currentValue += amount;
      }

      if (item.date > position.lastDate) {
        position.lastDate = item.date;
        position.institution = item.institution ?? position.institution;
        position.assetClass = item.assetClass ?? position.assetClass;
      }

      positions.set(key, position);
    }

    return [...positions.values()]
      .sort((a, b) => b.currentValue - a.currentValue)
      .filter((item) => item.currentValue !== 0 || item.quantity !== 0);
  }

  private normalizeName(value = '') {
    return value.trim().toLocaleLowerCase();
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
