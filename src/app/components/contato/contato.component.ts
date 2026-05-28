import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-contato',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './contato.component.html',
    styleUrls: ['./contato.component.css'],
})
export class ContatoComponent {
    form = {
        nome: '',
        email: '',
        mensagem: '',
    };

    enviado = false;

    enviarFormulario() {
        if (this.form.nome && this.form.email && this.form.mensagem) {
            console.log('Formulário enviado:', this.form);
            this.enviado = true;
            this.resetarFormulario();
            setTimeout(() => {
                this.enviado = false;
            }, 3000);
        }
    }

    resetarFormulario() {
        this.form = {
            nome: '',
            email: '',
            mensagem: '',
        };
    }
}
