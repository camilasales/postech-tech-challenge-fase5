# SeniorEase

Aplicacao em Expo React Native para web e mobile focada em acessibilidade digital para idosos, com personalizacao de leitura, organizacao simples de atividades e perfil do usuario.

## Funcionalidades

- Login e cadastro com persistencia local da sessao
- Painel de personalizacao com ajuste de fonte, contraste, espacamento, modo de interface e confirmacoes extras
- Lista de atividades com criacao, edicao, conclusao e filtros
- Perfil do usuario com edicao de nome, telefone e endereco
- Execucao em web e mobile a partir da mesma base

## Arquitetura

O projeto segue Clean Architecture com separacao por camadas:

- `src/domain`: entidades, contratos de repositorio e casos de uso (sem dependencia de UI)
- `src/data`: datasources, mappers e implementacoes concretas dos repositorios
- `src/di`: injecao de dependencias via `ServiceLocator`
- `src/presentation`: exemplos de integracao da camada de apresentacao com casos de uso

Status atual:

- Estrutura base de Clean Architecture implementada
- Casos de uso independentes de UI
- Adaptadores e interfaces definidos

## Requisitos

- Node.js 18+
- NPM 9+

## Instalacao

```bash
npm install
```

## Como rodar

Em um terminal:

```bash
npm run server
```

Em outro terminal:

```bash
npm run start
```

Para abrir direto na web:

```bash
npm run web
```

Para Android:

```bash
npm run start:android
```

## Usuario de teste

- Email: `teste@teste.com`
- Senha: `teste1234`

## Scripts uteis

- `npm run lint`: valida o codigo com ESLint
- `npm run test`: executa os testes com Vitest
- `npm run build:web`: gera a build estatica web
- `npm run server`: sobe o json-server na porta `3001`

## Observacoes

- O backend local usa `json-server` com dados em `db.json`
- Em dispositivo fisico, defina `EXPO_PUBLIC_JSON_SERVER_URL` com o IP da sua maquina se necessario
- A pipeline de CI do repositorio roda instalacao, lint, testes e build web
