import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
})
export class LoginComponent {
    email = '';
    password = '';
    displayName = '';
    isRegistering = false;
    loading = false;
    errorMessage = '';

    constructor(
        private auth: AuthService,
        private router: Router,
        private route: ActivatedRoute,
    ) { }

    get title() {
        return this.isRegistering ? 'Criar conta' : 'Entrar';
    }

    async submit() {
        if (!this.email || !this.password || this.loading) {
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        try {
            if (this.isRegistering) {
                await this.auth.register(this.email, this.password, this.displayName);
            } else {
                await this.auth.login(this.email, this.password);
            }
            await this.goToReturnUrl();
        } catch (error) {
            this.errorMessage = this.getErrorMessage(error);
        } finally {
            this.loading = false;
        }
    }

    async loginWithGoogle() {
        if (this.loading) {
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        try {
            await this.auth.loginWithGoogle();
            await this.goToReturnUrl();
        } catch (error) {
            this.errorMessage = this.getErrorMessage(error);
        } finally {
            this.loading = false;
        }
    }

    toggleMode() {
        this.isRegistering = !this.isRegistering;
        this.errorMessage = '';
    }

    private goToReturnUrl() {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
        return this.router.navigateByUrl(returnUrl);
    }

    private getErrorMessage(error: unknown) {
        if (!(error instanceof FirebaseError)) {
            return 'Não foi possível autenticar agora. Tente novamente.';
        }

        const messages: Record<string, string> = {
            'auth/email-already-in-use': 'Este email já está em uso.',
            'auth/invalid-credential': 'Email ou senha inválidos.',
            'auth/invalid-email': 'Informe um email válido.',
            'auth/popup-closed-by-user': 'Login cancelado antes de concluir.',
            'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
            'auth/weak-password': 'Use uma senha com pelo menos 6 caracteres.',
        };

        return messages[error.code] ?? 'Não foi possível autenticar agora. Verifique as credenciais.';
    }
}
