import { Routes } from '@angular/router';
import { SobreComponent } from './components/sobre/sobre.component';
import { ContatoComponent } from './components/contato/contato.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TransacoesComponent } from './components/transacoes/transacoes.component';
import { TransacoesGanhosComponent } from './components/transacoes/ganhos.component';
import { TransacoesGastosComponent } from './components/transacoes/gastos.component';
import { TransacoesInvestimentosComponent } from './components/transacoes/investimentos.component';
import { TransacoesBensComponent } from './components/transacoes/bens.component';
import { MovimentacoesComponent } from './components/transacoes/movimentacoes.component';
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
                component: DashboardComponent,
                data: { title: 'NewMoney - Dashboard' },
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
                path: 'perfil',
                redirectTo: '',
                pathMatch: 'full',
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
                        path: 'movimentacoes',
                        component: MovimentacoesComponent,
                    },
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
                        redirectTo: 'movimentacoes',
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
