# INSTRUÇÕES DE CONFIGURAÇÃO DO SUPABASE

## 1. Criar Projeto no Supabase

1. Acesse https://supabase.com
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha os dados:
   - **Name**: sistema-assinaturas (ou outro nome de sua preferência)
   - **Database Password**: crie uma senha forte e guarde
   - **Region**: escolha a região mais próxima (ex: South America)
   - **Pricing Plan**: Free
5. Clique em "Create new project"

## 2. Executar o Schema SQL

1. No menu lateral, clique em **SQL Editor** (ícone de código)
2. Clique em **New query**
3. Copie todo o conteúdo do arquivo `supabase-schema.sql`
4. Cole no editor SQL
5. Clique em **Run** (botão verde)
6. Aguarde a execução (deve aparecer "Success")

Isso criará:
- Tabela `subscribers` (assinantes)
- Tabela `subscriptions` (assinaturas)
- Tabela `payment_receipts` (comprovantes de pagamento)
- Todos os índices e políticas de segurança RLS

## 3. Criar Bucket de Storage

1. No menu lateral, clique em **Storage** (ícone de arquivo)
2. Clique em **New bucket**
3. Preencha:
   - **Name**: receipts
   - **Public bucket**: DESMARQUE (deixe privado)
4. Clique em **Create bucket**
5. Após criar, clique nos 3 pontinhos do bucket "receipts" e selecione **Policies**
6. Verifique se as políticas foram criadas (elas já são criadas automaticamente pelo SQL)

## 4. Criar Usuário Administrador

1. No menu lateral, clique em **Authentication** (ícone de cadeado)
2. Clique na aba **Users**
3. Clique em **Add user** > **Create new user**
4. Preencha:
   - **Email**: seu-email@exemplo.com (use um email real)
   - **Password**: crie uma senha forte
   - **Auto Confirm User**: MARQUE esta opção
5. Clique em **Create user**

## 5. Obter Credenciais do Projeto

1. No menu lateral, clique em **Settings** (ícone de engrenagem)
2. Clique em **API**
3. Copie as seguintes informações:

### URL do Projeto
- **Project URL**: copie esta URL
- Exemplo: `https://abcdefghijk.supabase.co`

### Chaves de API
- **project `anon` `public`**: copie esta chave
- Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 6. Configurar Variáveis de Ambiente

1. Abra o arquivo `.env.local` na raiz do projeto
2. Substitua os valores:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-public
```

**IMPORTANTE**: Use a chave `anon` (pública), NÃO use a chave `service_role`

## 7. Verificar Configuração

1. Certifique-se de que o servidor de desenvolvimento está parado (Ctrl+C)
2. Inicie novamente: `npm run dev`
3. Acesse: http://localhost:3000
4. Você deve ser redirecionado para /login
5. Faça login com o e-mail e senha que você criou no passo 4

## Estrutura das Tabelas

### subscribers (assinantes)
- `id` (UUID, primary key)
- `full_name` (text, obrigatório)
- `contact_email` (text, obrigatório)
- `whatsapp_number` (text, obrigatório)
- `created_at` (timestamp)

### subscriptions (assinaturas)
- `id` (UUID, primary key)
- `subscriber_id` (UUID, foreign key para subscribers)
- `start_date` (date, obrigatório)
- `end_date` (date, obrigatório)
- `is_active` (boolean, padrão: true)
- Constraint: `end_date >= start_date`

### payment_receipts (comprovantes)
- `id` (UUID, primary key)
- `subscriber_id` (UUID, foreign key para subscribers)
- `reference_month` (text, formato: YYYY-MM)
- `file_url` (text, obrigatório)
- `uploaded_at` (timestamp)
- `admin_id` (UUID, foreign key para auth.users)

## Políticas de Segurança (RLS)

Todas as tabelas têm RLS habilitado com políticas que permitem:
- **SELECT**: apenas usuários autenticados
- **INSERT**: apenas usuários autenticados
- **UPDATE**: apenas usuários autenticados
- **DELETE**: apenas usuários autenticados

Isso garante que apenas o administrador logado possa acessar os dados.

## Solução de Problemas

### Erro de autenticação ao fazer login
- Verifique se o usuário foi criado em Authentication > Users
- Confirme que a opção "Auto Confirm User" estava marcada
- Verifique se as variáveis no `.env.local` estão corretas

### Erro ao acessar tabelas
- Verifique se o SQL foi executado com sucesso
- Confirme que o RLS está habilitado em todas as tabelas
- Verifique se as políticas foram criadas

### Erro ao fazer upload de arquivos
- Confirme que o bucket "receipts" foi criado
- Verifique se o bucket é privado (não público)
- Confirme que as políticas do storage foram criadas

### Erro de CORS ou conexão
- Verifique se a URL do projeto está correta no `.env.local`
- Confirme que está usando a chave `anon` (pública)

## Próximos Passos

Após configurar o Supabase:
1. Teste o login com o usuário criado
2. Cadastre um assinante de teste
3. Crie uma assinatura para o assinante
4. Faça upload de um comprovante de teste
5. Verifique se os alertas de vencimento aparecem

Tudo funcionando? O sistema está pronto para uso!
