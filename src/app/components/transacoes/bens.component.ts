import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, emptySummary, FinancialSummary } from '../../services/transaction.service';
import { PersonalAsset } from '../../models/transaction.model';

@Component({
    selector: 'app-transacoes-bens',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './bens.component.html',
    styleUrls: ['./bens.component.css'],
})
export class TransacoesBensComponent implements OnInit {
    items: PersonalAsset[] = [];
    totals: FinancialSummary = emptySummary();
    editingId: string | null = null;
    loading = false;
    errorMessage = '';
    form: Partial<PersonalAsset> = this.getEmptyForm();

    categories = ['Imóvel', 'Veículo', 'Equipamento', 'Joias', 'Empresa', 'Direitos', 'Outros'];
    liquidities = [
        { value: 'alta', label: 'Alta' },
        { value: 'media', label: 'Média' },
        { value: 'baixa', label: 'Baixa' },
    ];
    statuses = [
        { value: 'ativo', label: 'Ativo' },
        { value: 'quitado', label: 'Quitado' },
        { value: 'vendido', label: 'Vendido' },
    ];

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
                this.service.getAssets(),
                this.service.getSummary(),
            ]);
        } catch {
            this.errorMessage = 'Nao foi possivel carregar os bens.';
        } finally {
            this.loading = false;
        }
    }

    async save() {
        if (!this.form.name || !this.form.category || !this.form.acquisitionDate) {
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        const payload: Omit<PersonalAsset, 'id'> = {
            name: this.form.name!,
            category: this.form.category!,
            acquisitionDate: this.form.acquisitionDate!,
            acquisitionValue: Number(this.form.acquisitionValue || 0),
            currentValue: Number(this.form.currentValue || 0),
            liquidity: this.form.liquidity ?? 'media',
            status: this.form.status ?? 'ativo',
            notes: this.form.notes,
        };

        try {
            if (this.editingId) {
                await this.service.updateAsset(this.editingId, payload);
            } else {
                await this.service.addAsset(payload);
            }
            this.resetForm();
            await this.loadData();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            this.errorMessage = `Nao foi possivel salvar o bem. ${message}`;
        } finally {
            this.loading = false;
        }
    }

    edit(item: PersonalAsset) {
        this.editingId = item.id;
        this.form = { ...item };
    }

    async remove(id: string) {
        this.loading = true;
        this.errorMessage = '';

        try {
            await this.service.removeAsset(id);
            if (this.editingId === id) {
                this.resetForm();
            }
            await this.loadData();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            this.errorMessage = `Nao foi possivel excluir o bem. ${message}`;
        } finally {
            this.loading = false;
        }
    }

    resetForm() {
        this.editingId = null;
        this.form = this.getEmptyForm();
    }

    private getEmptyForm(): Partial<PersonalAsset> {
        return {
            name: '',
            category: 'Imóvel',
            acquisitionDate: new Date().toISOString().substring(0, 10),
            acquisitionValue: 0,
            currentValue: 0,
            liquidity: 'media',
            status: 'ativo',
            notes: '',
        };
    }
}
