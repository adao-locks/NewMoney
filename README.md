# Desk App - Aplicação Angular com Rotas

## 📋 Descrição

Uma aplicação Angular moderna com sistema de rotas completo e funcional. Este projeto serve como base para aprender sobre Angular Standalone Components, Routing e boas práticas.

## 🎯 Objetivo

Demonstrar como criar uma aplicação Angular com:

- Componentes Standalone (sem NgModules)
- Sistema de rotas com navegação
- Componentes reutilizáveis
- Formulários com validação
- Estilos responsivos

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20+ e npm

### Instalação

```bash
# Clonar o repositório
git clone <seu-repositorio>
cd desk

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm start
```

Abra seu navegador em `http://localhost:4200`

## 📚 Estrutura de Diretórios

```
src/
├── app/
│   ├── components/
│   │   ├── home/           # Componente de home
│   │   ├── sobre/          # Componente sobre
│   │   └── contato/        # Componente contato
│   ├── services/           # Serviços da aplicação
│   ├── app.component.*     # Componente raiz
│   ├── app.routes.ts       # Rotas da aplicação
│   └── app.config.ts       # Configuração do app
├── main.ts                 # Ponto de entrada
├── index.html              # HTML principal
└── styles.css              # Estilos globais
```

## 🛣️ Rotas

| Rota       | Descrição      | Componente       |
| ---------- | -------------- | ---------------- |
| `/`        | Página inicial | HomeComponent    |
| `/sobre`   | Página sobre   | SobreComponent   |
| `/contato` | Formulário     | ContatoComponent |

## 🔨 Comandos

```bash
# Desenvolvimento
npm start                  # Inicia servidor dev
npm run build             # Build para produção
npm test                  # Executa testes
npm run watch             # Build em modo watch
```

## ✨ Funcionalidades

- 📄 Componentes Standalone
- 🛣️ Sistema de Rotas Avançado
- 📱 Design Responsivo
- 🎨 Estilos CSS3 Moderno
- ⚡ Performance Otimizada
- 🔍 Navegação com Link Ativo

## 📦 Dependências Principais

- **@angular/core**: Framework Angular
- **@angular/router**: Sistema de rotas
- **@angular/forms**: Manipulação de formulários
- **@angular/platform-browser**: Renderização no navegador
- **rxjs**: Programação reativa
- **typescript**: Linguagem de tipagem

## 🎓 Aprendizado

Este projeto é ideal para aprender:

1. **Componentes Standalone** - Como criar componentes sem NgModules
2. **Roteamento Angular** - Configuração e navegação de rotas
3. **Two-Way Binding** - Uso de ngModel em formulários
4. **Angular Forms** - FormsModule e validações
5. **CSS Moderno** - Flexbox, Grid e animações

## 🐛 Troubleshooting

### Erro de execução do npm

Se encontrar erro de política de execução do PowerShell no Windows, execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Porta 4200 já em uso

```bash
ng serve --port 4300
```

### Limpar cache

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📖 Documentação Adicional

- [Documentação Angular](https://angular.io)
- [Angular CLI](https://angular.io/cli)
- [TypeScript](https://www.typescriptlang.org)

## 👤 Autor

Projeto de exemplo para fins educacionais.

## 📄 Licença

MIT
