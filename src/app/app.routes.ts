import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SobreComponent } from './components/sobre/sobre.component';
import { ContatoComponent } from './components/contato/contato.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TransacoesComponent } from './components/transacoes/transacoes.component';
import { TransacoesGanhosComponent } from './components/transacoes/ganhos.component';
import { TransacoesGastosComponent } from './components/transacoes/gastos.component';
import { TransacoesInvestimentosComponent } from './components/transacoes/investimentos.component';
import { TransacoesBensComponent } from './components/transacoes/bens.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        data: { title: 'Desk App - Home' }
    },
    {
        path: 'sobre',
        component: SobreComponent,
        data: { title: 'Desk App - Sobre' }
    },
    {
        path: 'contato',
        component: ContatoComponent,
        data: { title: 'Desk App - Contato' }
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        data: { title: 'Desk App - Dashboard' }
    },
    {
        path: 'transacoes',
        component: TransacoesComponent,
        children: [
            {
                path: 'ganhos',
                component: TransacoesGanhosComponent,
            },
            {
                path: 'gastos',
                component: TransacoesGastosComponent,
            },
            {
                path: 'investimentos',
                component: TransacoesInvestimentosComponent,
            },
            {
                path: 'bens',
                component: TransacoesBensComponent,
            },
            {
                path: '',
                redirectTo: 'ganhos',
                pathMatch: 'full',
            },
        ],
        data: { title: 'Desk App - Transações' }
    },
    {
        path: '**',
        redirectTo: ''
    }
];
