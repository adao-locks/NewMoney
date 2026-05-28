# Instruções de Uso - Projeto Angular com Rotas

## ✅ O Projeto Foi Criado com Sucesso!

Você agora tem um projeto Angular completo com sistema de rotas funcional.

## 🚀 Próximos Passos

### 1. **Instale as Dependências**

No terminal do VS Code, execute a tarefa "Install Dependencies":

- Pressione `Ctrl+Shift+B`
- Ou vá para Terminal > Run Task > "Install Dependencies"

Ou execute manualmente:

```bash
npm install
```

### 2. **Inicie o Servidor de Desenvolvimento**

Após instalar as dependências, execute:

```bash
npm start
```

Ou use a tarefa "Start Development Server" do VS Code:

- Vá para Terminal > Run Task > "Start Development Server"

A aplicação estará em: **http://localhost:4200**

### 3. **Navegue pela Aplicação**

Você verá um menu com 3 páginas:

- **Home** - Página inicial com informações
- **Sobre** - Página sobre o projeto
- **Contato** - Formulário com validação

## 📁 Arquivos Principais

- `src/app/app.routes.ts` - Configuração de rotas
- `src/app/components/` - Componentes das páginas
- `src/app/app.component.ts` - Componente raiz com navegação
- `src/styles.css` - Estilos globais

## 🔧 Personalizações Úteis

### Adicionar uma Nova Rota

1. Crie um novo componente em `src/app/components/`
2. Adicione à rota em `src/app/app.routes.ts`:

```typescript
{ path: 'sua-rota', component: SeuComponent }
```

3. Adicione ao menu em `src/app/app.component.html`:

```html
<li><a routerLink="/sua-rota">Sua Página</a></li>
```

### Adicionar um Serviço

1. Crie `src/app/services/seu-servico.service.ts`
2. Injete nos componentes que precisam

### Integrar com uma API

Use o `HttpClient` em um serviço:

```typescript
import { HttpClient } from '@angular/common/http';

@Injectable()
export class MeuServico {
  constructor(private http: HttpClient) {}
}
```

## 📚 Documentação

- Angular: https://angular.io
- TypeScript: https://www.typescriptlang.org
- RxJS: https://rxjs.dev

## 💡 Dicas

- Use `routerLink` para navegação (sem recarregar página)
- Use `routerLinkActive="active"` para destacar link ativo
- Componentes Standalone não precisam de NgModules
- Use `FormsModule` com `[(ngModel)]` para two-way binding

## ❓ Dúvidas?

Consulte a [documentação oficial do Angular](https://angular.io/docs) ou o [guia de rotas](https://angular.io/guide/router).

---

**Bom desenvolvimento! 🚀**
