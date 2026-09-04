import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from 'firebase/auth';
import { tap } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { DataDeleteKind, TransactionService } from '../../services/transaction.service';
import { Institution } from '../../models/transaction.model';

interface DeleteOption {
  kind: DataDeleteKind;
  title: string;
  description: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css'],
})
export class PerfilComponent {
  readonly user$ = this.auth.user$.pipe(
    tap((user) => {
      if (user) {
        this.syncForm(user);
      }
    }),
  );

  institutions: Institution[] = [];
  editingInstitutions = false;
  newInstitution = '';
  institutionMessage = '';
  institutionError = '';
  adding = false;
  removing = false;
  displayName = '';
  message = '';
  error = '';
  saving = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordMessage = '';
  passwordError = '';
  changingPassword = false;
  readonly deleteOptions: DeleteOption[] = [
    {
      kind: 'investments',
      title: 'Excluir investimentos',
      description: 'Remove todos os aportes, resgates e rendimentos cadastrados.',
    },
    {
      kind: 'incomes',
      title: 'Excluir ganhos',
      description: 'Remove todos os registros de entrada financeira.',
    },
    {
      kind: 'expenses',
      title: 'Excluir gastos',
      description: 'Remove todos os registros de saida financeira.',
    },
    {
      kind: 'assets',
      title: 'Excluir bens',
      description: 'Remove todos os bens patrimoniais cadastrados.',
    },
    {
      kind: 'all',
      title: 'Excluir tudo',
      description: 'Remove investimentos, ganhos, gastos e bens de uma vez.',
    },
  ];
  pendingDelete: DeleteOption | null = null;
  deleteConfirmation = '';
  deleteMessage = '';
  deleteError = '';
  deleting = false;
  private loadedUid = '';
  budget = 0;
  loadingBudget = false;
  savingBudget = false;
  budgetMessage = '';
  budgetError = '';

  constructor(
    public auth: AuthService,
    private transactionService: TransactionService,
  ) { }

  private syncForm(user: User) {
    if (this.loadedUid === user.uid) {
      return;
    }

    this.loadedUid = user.uid;
    this.displayName = user.displayName ?? '';
    this.loadInstitutions();
    this.loadBudget();
  }

  providerLabel(user: User) {
    const providerId = user.providerData[0]?.providerId ?? 'password';

    if (providerId === 'google.com') {
      return 'Google';
    }

    if (providerId === 'password') {
      return 'E-mail e senha';
    }

    return providerId;
  }

  canChangePassword(user: User) {
    return user.providerData.some((provider) => provider.providerId === 'password');
  }

  async saveProfile() {
    this.message = '';
    this.error = '';
    this.saving = true;

    try {
      await this.auth.updateDisplayName(this.displayName);
      this.message = 'Perfil atualizado com sucesso.';
    } catch (error) {
      this.error = 'Nao foi possivel atualizar o perfil agora.';
      console.error(error);
    } finally {
      this.saving = false;
    }
  }

  async changePassword() {
    this.passwordMessage = '';
    this.passwordError = '';

    if (this.newPassword.length < 6) {
      this.passwordError = 'A nova senha precisa ter pelo menos 6 caracteres.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'A confirmacao precisa ser igual a nova senha.';
      return;
    }

    this.changingPassword = true;

    try {
      await this.auth.updatePassword(this.currentPassword, this.newPassword);
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
      this.passwordMessage = 'Senha alterada com sucesso.';
    } catch (error) {
      this.passwordError = this.passwordErrorMessage(error);
      console.error(error);
    } finally {
      this.changingPassword = false;
    }
  }

  private passwordErrorMessage(error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'A senha atual esta incorreta.';
    }

    if (code === 'auth/weak-password') {
      return 'A nova senha e muito fraca.';
    }

    if (code === 'auth/too-many-requests') {
      return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
    }

    return 'Nao foi possivel alterar a senha agora.';
  }

  selectDeleteOption(option: DeleteOption) {
    if (this.deleting) {
      return;
    }

    this.pendingDelete = option;
    this.deleteConfirmation = '';
    this.deleteMessage = '';
    this.deleteError = '';
  }

  cancelDelete() {
    if (this.deleting) {
      return;
    }

    this.pendingDelete = null;
    this.deleteConfirmation = '';
  }

  get canConfirmDelete() {
    return this.pendingDelete !== null && this.deleteConfirmation.trim().toUpperCase() === 'EXCLUIR';
  }

  async confirmDelete() {
    if (!this.pendingDelete || !this.canConfirmDelete) {
      return;
    }

    const option = this.pendingDelete;
    this.deleting = true;
    this.deleteMessage = '';
    this.deleteError = '';

    try {
      const deletedCount = await this.transactionService.deleteUserData(option.kind);
      this.deleteMessage = `${option.title}: ${deletedCount} registro(s) excluido(s).`;
      this.pendingDelete = null;
      this.deleteConfirmation = '';
    } catch (error) {
      this.deleteError = 'Nao foi possivel excluir os dados agora.';
      console.error(error);
    } finally {
      this.deleting = false;
    }
  }

  async loadInstitutions() {
    this.institutionMessage = '';
    this.institutionError = '';

    try {
      this.institutions = await this.transactionService.getInstitutions();
    } catch (error) {
      this.institutionError = 'Nao foi possivel carregar as instituicoes.';
      console.error(error);
    }
  }

  async addInstitution() {
    const name = this.newInstitution.trim();
    this.institutionMessage = '';
    this.institutionError = '';

    if (!name) {
      this.institutionError = 'Informe o nome da instituicao.';
      return;
    }

    const alreadyExists = this.institutions.some((institution) =>
      institution.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase()
    );

    if (alreadyExists) {
      this.institutionError = 'Esta instituicao ja esta vinculada ao seu perfil.';
      return;
    }

    this.adding = true;

    try {
      const institution = await this.transactionService.addInstitution(name);
      this.institutions = [...this.institutions, institution]
        .sort((a, b) => a.name.localeCompare(b.name));
      this.newInstitution = '';
      this.institutionMessage = 'Instituicao adicionada com sucesso.';
    } catch (error) {
      this.institutionError = 'Nao foi possivel adicionar a instituicao agora.';
      console.error(error);
    } finally {
      this.adding = false;
    }
  }

  async removeInstitution(institution: Institution) {
    this.institutionMessage = '';
    this.institutionError = '';

    if (this.removing) {
      return;
    }

    this.removing = true;

    try {
      await this.transactionService.removeInstitution(institution.id);
      this.institutions = this.institutions.filter((item) => item.id !== institution.id);
      this.institutionMessage = 'Instituicao removida com sucesso.';
    } catch (error) {
      this.institutionError = 'Nao foi possivel remover a instituicao agora.';
      console.error(error);
    } finally {
      this.removing = false;
    }
  }

  async loadBudget() {
    this.budgetMessage = '';
    this.budgetError = '';
    this.loadingBudget = true;

    try {
      this.budget = await this.transactionService.getBudget();
    } catch (error) {
      this.budgetError = 'Nao foi possivel carregar o orcamento.';
      console.error(error);
    } finally {
      this.loadingBudget = false;
    }
  }

  async saveBudget() {
    this.budgetMessage = '';
    this.budgetError = '';

    const value = Number(this.budget);
    if (!Number.isFinite(value) || value < 0) {
      this.budgetError = 'Informe um valor de orcamento valido.';
      return;
    }

    this.savingBudget = true;

    try {
      this.budget = await this.transactionService.saveBudget(value);
      this.budgetMessage = 'Orcamento salvo com sucesso.';
    } catch (error) {
      this.budgetError = 'Nao foi possivel salvar o orcamento agora.';
      console.error(error);
    } finally {
      this.savingBudget = false;
    }
  }
}
