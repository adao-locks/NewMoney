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
import { LoginComponent } from './components/login/login.component';
import { authChildGuard, authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent,
        data: { title: 'NewMoney - Login' },
    },
    {
        path: '',
        canActivate: [authGuard],
        canActivateChild: [authChildGuard],
        children: [
            {
                path: '',
                component: HomeComponent,
                data: { title: 'NewMoney - Home' },
            },
            {
                path: 'sobre',
                component: SobreComponent,
                data: { title: 'NewMoney - Sobre' },
            },
            {
                path: 'contato',
                component: ContatoComponent,
                data: { title: 'NewMoney - Contato' },
            },
            {
                path: 'dashboard',
                component: DashboardComponent,
                data: { title: 'NewMoney - Dashboard' },
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
                data: { title: 'NewMoney - Transacoes' },
            },
        ],
    },
    {
        path: '**',
        redirectTo: '',
    },
];
