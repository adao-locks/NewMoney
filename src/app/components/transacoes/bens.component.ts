import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { PersonalAsset } from '../../models/transaction.model';

@Component({
    selector: 'app-transacoes-bens',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './bens.component.html',
    styleUrls: ['./bens.component.css'],
})
export class TransacoesBensComponent {
    service = new TransactionService();
    editingId: string | null = null;
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

    get items() {
        return this.service.getAssets();
    }

    get totals() {
        return this.service.getSummary();
    }

    get isEditing() {
        return !!this.editingId;
    }

    save() {
        if (!this.form.name || !this.form.category || !this.form.acquisitionDate) {
            return;
        }

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

        if (this.editingId) {
            this.service.updateAsset(this.editingId, payload);
        } else {
            this.service.addAsset(payload);
        }

        this.resetForm();
    }

    edit(item: PersonalAsset) {
        this.editingId = item.id;
        this.form = { ...item };
    }

    remove(id: string) {
        this.service.removeAsset(id);
        if (this.editingId === id) {
            this.resetForm();
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
