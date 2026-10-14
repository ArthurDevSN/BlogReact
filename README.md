# MiniBlog

Blog em português feito com React 19, React Router 7 e Firebase (Authentication e Firestore). Permite ler e buscar posts por tag, criar uma conta e gerenciar os próprios posts.

## Executar localmente

Requer Node.js 20 ou superior e npm. A validação deste projeto usa Node.js 24.

```sh
npm ci
npm start
```

Abra http://localhost:3000. O projeto mantém a configuração pública original do Firebase. Para usar outro projeto, copie `.env.example` para `.env.local`, preencha as variáveis `REACT_APP_FIREBASE_*` e reinicie o servidor. Habilite o provedor E-mail/Senha no Firebase Authentication e crie um banco Firestore.

As variáveis `REACT_APP_*` são incluídas no JavaScript entregue ao navegador. Use apenas a configuração pública do aplicativo web; credenciais administrativas e chaves de conta de serviço não pertencem a esses arquivos. A autorização dos dados é feita pelas regras do Firestore.

## Verificação

```sh
npm run lint
npm run test:ci
CI=true npm run build
```

Os testes usam mocks do Firebase e não escrevem no banco remoto. Cobrem autenticação, rotas protegidas, confirmação de salvamento, propriedade dos posts, falhas de consulta, limpeza de listeners, respostas antigas e busca por tags. A configuração Jest contém um mapeamento para o subpath `react-router/dom`, necessário para o Jest 27 incluído no Create React App.

O workflow `.github/workflows/ci.yml` executa lint, testes e build em pushes e pull requests. O comando `npm test` continua disponível em modo interativo.

Para verificar as regras com um emulador Firestore local, instale a CLI Firebase e Java e execute:

```sh
firebase emulators:exec --only firestore --project demo-miniblog-review "node scripts/test-firestore-rules.cjs"
```

O script recusa hosts remotos e projetos que não comecem com `demo-`. Ele verifica acesso público, propriedade, schema, timestamps e proteção das demais coleções. A execução do emulador exige baixar um JAR de `storage.googleapis.com`; essa validação não foi executada neste ambiente porque esse download foi bloqueado pela política de rede.

## Dados e autorização

Os posts ficam na coleção **`post`** (singular), com os campos:

| Campo | Tipo / limite |
| --- | --- |
| `title` | Texto obrigatório, até 200 caracteres |
| `image` | URL HTTP ou HTTPS, até 2.048 caracteres |
| `body` | Texto obrigatório, até 50.000 caracteres |
| `tagsArray` | De 1 a 20 tags únicas, até 50 caracteres cada |
| `uid` | Identificador do autor no Firebase Authentication |
| `createdBy` | Nome do autor, de 1 a 80 caracteres |
| `createdAt` | Timestamp gerado pelo servidor na criação |

O formulário remove espaços nas extremidades e normaliza as tags para minúsculas. A busca usa uma tag exata, sem distinguir maiúsculas após essa normalização; os resultados são ordenados do mais recente para o mais antigo. O feed também ordena por `createdAt`.

Resultados recebidos do cache são identificados na interface. Um cache vazio aguarda a confirmação do servidor antes de afirmar que não existem posts.

`firestore.rules` permite leitura pública e exige autenticação para criar posts com o próprio `uid`. Somente o autor pode editar ou excluir. Edições preservam autor, nome do autor e data de criação. As demais coleções ficam sem acesso por essas regras. `firestore.indexes.json` declara os índices compostos usados pela busca e pelo dashboard.

As regras e os índices precisam ser publicados no projeto Firebase escolhido para entrar em vigor. Com a CLI Firebase instalada e autenticada, selecione o projeto correto e execute:

```sh
firebase deploy --only firestore:rules,firestore:indexes
```

A publicação dos índices pode levar alguns minutos. Dados antigos sem `createdAt` não aparecem em consultas ordenadas por esse campo. Antes de publicar as regras em um banco existente, revise posts antigos com campos ausentes, nomes vazios ou campos adicionais, pois eles podem exigir adequação ao schema para permitir edição. Este trabalho não migra dados remotos automaticamente.

## Build e hospedagem

`npm run build` gera os arquivos estáticos em `build/`. O `firebase.json` já contém a regra de reescrita das rotas para `index.html`, permitindo abrir URLs internas diretamente no Firebase Hosting.

Nenhum deploy é feito pelos comandos de validação ou pelo workflow de CI.

## Dependências

O projeto ainda utiliza Create React App 5, que inclui ferramentas antigas. Atualizações compatíveis foram aplicadas ao lockfile; ainda existem alertas transitivos no `npm audit`. A migração do build e dos testes para ferramentas mantidas deve ser tratada em uma mudança própria. Evite `npm audit fix --force`: as sugestões atuais incluem remover o funcionamento do `react-scripts` e fazer downgrade do Firebase.
