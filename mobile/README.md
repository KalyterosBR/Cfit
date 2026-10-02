# Cfit Mobile

Aplicativo do aluno com React Native, Expo 57 e TypeScript, mantendo logos, card escuro, azul e ciano do Cfit web.

## Conexão e autenticação

O app usa `https://cfit-api.vercel.app/api`. A API Django publicada no Vercel acessa o Neon e continua responsável por isolamento de academia/aluno, permissões e regras de negócio. Nunca colocar `DATABASE_URL`, senha de banco ou outros secrets no app.

O login nativo usa `POST /api/auth/mobile/login/`, sem Turnstile por decisão do usuário. O login web continua protegido por Turnstile em `/api/auth/login/`. A rota foi publicada no backend de produção em 02/10/2026. Novos ambientes também precisam receber a migration `users/0009` antes do uso.

O endpoint nativo aceita e-mail, senha e, quando exigido, `two_factor_code`. Limites persistentes: 30 requisições por IP e 10 por conta a cada janela de 15 minutos, incluindo tentativas de segundo fator. Contadores são transacionais no banco, sem depender do cache de uma instância do Vercel. Códigos de segundo fator expiram em cinco minutos, são armazenados com hash, têm uso único e envio limitado a uma vez por minuto. O endpoint aceita exclusivamente contas vinculadas ao portal do aluno; administradores continuam usando o web. Limites também se aplicam a chamadas feitas fora do aplicativo.

Com “Manter conectado”, os tokens ficam no Expo SecureStore; sem essa opção, somente em memória até o processo encerrar. A abertura restaura e valida a sessão antes de exibir qualquer área privada. A renovação JWT preserva a escolha de persistência, coordena chamadas concorrentes e encerra sessões revogadas. Falhas de rede mantêm a sessão salva para nova tentativa. Logout limpa memória e armazenamento local.

O primeiro acesso exige troca de senha antes de consultar dados do portal. A recuperação abre o fluxo publicado do web. Treinos, agenda, matrículas, cobranças, check-ins, avaliações e documentos são consultas reais de `/api/users/portal/me/`, sem enviar um identificador de outro aluno. Reservas e alterações de perfil ainda são feitas pelo portal web.

Configuração opcional: copie `.env.example` para `.env`. Somente URLs públicas são necessárias. A configuração padrão já aponta para produção.

## Executar

```bash
cd mobile
npm ci
EXPO_OFFLINE=1 npx expo start --go --localhost
```

Abra no Expo Go compatível com o SDK de package.json. No Windows com servidor no WSL, execute `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/open-android.ps1` na pasta mobile. O script usa o adb do Android SDK do Windows, conecta a porta 8081 com `adb reverse` e abre o Expo Go. Mantenha somente um dispositivo conectado. O encaminhamento localhost do WSL para Windows precisa estar funcionando.

## Verificar

```bash
npm test
npx expo lint
npx tsc --noEmit
EXPO_OFFLINE=1 npx expo export --platform android
```

Os testes de sessão usam HTTP e armazenamento simulados, sem credenciais reais. No ambiente Docker, execute `docker compose exec django python manage.py test apps.users` e `docker compose exec django python manage.py makemigrations --check --dry-run` para verificar a nova autenticação e as migrations.

A migration `users/0009` cria contadores e desafios de login nativo. O build de produção existente aplica migrations na conexão Neon configurada pelo Django. Não apontar testes ou migrations de desenvolvimento para o banco publicado.

Rotas em `src/app/` com Expo Router. O React Native DevTools desktop pode exigir bibliotecas adicionais no WSL (`libnspr4`); isso não impede a execução no Android. As dependências iniciais têm avisos do npm audit, que devem ser revisados antes da distribuição.

## Portal do aluno

- Início focado na ficha ativa, botão Treinar agora/Continuar treino e próxima reserva entre as turmas retornadas.
- Treinos com busca por nome, objetivo ou exercício; fichas expansíveis com séries, repetições, carga em kg e descanso. O modo Treinar agora mostra um exercício por vez, marca séries, registra a carga realizada e conta o descanso por prazo absoluto, inclusive após retornar do segundo plano.
- Agenda com busca por turma/local, filtros Próximas, Minhas reservas e Anteriores, ocupação e status da reserva.
- Perfil com matrículas e seções expansíveis de cobranças (filtros Todas/Em aberto/Pagas), acessos, avaliações e conteúdo dos documentos.
- Cabeçalho compacto com acesso ao perfil; logout no Perfil, disponível também quando a consulta falha.

As consultas respeitam os limites atuais da API: até 20 turmas, cobranças, acessos e documentos e 10 avaliações. Filtros operam sobre os registros retornados; não representam o histórico completo. Valores e categorias financeiras vêm do backend. Aceite de documentos, reservas e alterações cadastrais permanecem no portal web.

Login validado pelo usuário com uma conta real de aluno. Próxima etapa de distribuição: preparar uma development build própria.

## Sessões de treino

O app consulta e conclui sessões em `/api/users/portal/workouts/<workout_id>/`. O endpoint é exclusivo do aluno ativo vinculado à ficha, após a troca obrigatória de senha. As séries são verificadas com a prescrição atual; alterações na ficha exigem reabertura.

A conclusão salva carga realizada, séries, repetições e nome do exercício como snapshot em `WorkoutSession.exercise_results`, sem alterar a prescrição nem o histórico de mudanças do professor. `submission_id` garante repetição segura do mesmo envio, e a regra existente de uma sessão por ficha/data permanece. O horário de término fica congelado na primeira tentativa, preservando a duração em novas tentativas; conclusões de até sete dias atrás podem ser enviadas, com duração máxima de 24 horas. A operação é transacional e auditada.

A migration `workouts/0004` adiciona somente dois campos às sessões existentes; os registros anteriores permanecem com resultados vazios. A API precisa receber essa versão antes de o novo modo funcionar no app.

Sessões em andamento ficam na memória, isoladas pela conta e removidas no logout. Voltar entre telas permite retomar, mas encerrar o processo do app perde uma sessão não enviada. Falha de envio mantém a sessão na memória para nova tentativa. O histórico concluído fica no banco e aparece ao abrir a ficha (últimas 20 sessões). Nenhum dado de treino fictício faz parte das telas do produto.
