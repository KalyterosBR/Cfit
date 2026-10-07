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

- Início focado na ficha ativa, botão Treinar agora/Continuar treino e próxima reserva entre as turmas retornadas. Atalhos abrem telas próprias de Financeiro, Acessos, Avaliações e Documentos em `/acompanhamento?section=...`; cobranças em aberto e documentos aguardando aceite são contados somente entre os registros retornados. O aviso de atenção considera cobranças vencidas e documentos pendentes.
- Treinos com busca por nome, objetivo ou exercício; fichas expansíveis com séries, repetições, carga em kg e descanso. O modo Treinar agora mostra um exercício por vez, marca séries, registra a carga realizada e conta o descanso por prazo absoluto, inclusive após retornar do segundo plano.
- Agenda com busca por turma/local, filtros Próximas, Minhas reservas e Anteriores, resumo de reservas próximas, ocupação visual e status da reserva. Reserva, lista de espera e cancelamento usam confirmação e o endpoint existente do portal; o backend preserva a vaga em reenvios, controla vagas em transação e audita mudanças.
- Perfil dedicado ao cadastro: nome, e-mail, academia e unidade. Contatos permitem editar telefone e contato de emergência via PATCH validado e auditado. Matrículas atuais (ativas ou congeladas) aparecem em destaque; canceladas e encerradas ficam fora desse resumo. Detalhes expansíveis mostram início, duração, valor contratado, forma de cobrança, primeiro vencimento, congelamento e benefícios disponíveis. O primeiro vencimento não é apresentado como fim de vigência. Alterar senha abre `/seguranca`, reutilizando o formulário de primeiro acesso e o endpoint existente; após sucesso a sessão é encerrada e exige novo login. A tela de primeiro acesso preserva o bloqueio obrigatório.
- Históricos ficam nas telas de acompanhamento, cada uma exibindo somente seu domínio. Busca local e filtros financeiros e de documentos permanecem disponíveis; o Perfil não repete esses blocos.
- Cabeçalho compacto com acesso ao perfil; logout no Perfil, disponível também quando a consulta falha. Horário da última consulta concluída e atualização ao puxar a tela. Perfil e Documentos abrem o portal web no navegador, com tratamento de falha; a sessão do navegador pode exigir novo login e nenhum token é incluído no link.

As consultas respeitam os limites atuais da API: até 20 turmas próximas e 20 anteriores, 20 cobranças, acessos e documentos e 10 avaliações. Filtros operam sobre os registros retornados; não representam o histórico completo. Valores e categorias financeiras vêm do backend. Aceite de documentos e alterações de identidade permanecem no portal web/gestão. Contatos e reservas podem ser alterados no app. A API publicada em 07/10/2026 inclui os novos campos de matrícula e emergência; a interface mantém compatibilidade com a resposta anterior e não sobrescreve contatos de emergência ausentes dessa resposta.

Login validado pelo usuário com uma conta real de aluno. Próxima etapa de distribuição: preparar uma development build própria.

## Sessões de treino

O app consulta e conclui sessões em `/api/users/portal/workouts/<workout_id>/`. O endpoint é exclusivo do aluno ativo vinculado à ficha, após a troca obrigatória de senha. As séries são verificadas com a prescrição atual; alterações na ficha exigem reabertura.

A conclusão salva carga realizada, séries, repetições e nome do exercício como snapshot em `WorkoutSession.exercise_results`, sem alterar a prescrição nem o histórico de mudanças do professor. `submission_id` garante repetição segura do mesmo envio, e a regra existente de uma sessão por ficha/data permanece. O horário de término fica congelado na primeira tentativa, preservando a duração em novas tentativas; conclusões de até sete dias atrás podem ser enviadas, com duração máxima de 24 horas. A operação é transacional e auditada.

A migration `workouts/0004` adiciona somente dois campos às sessões existentes; os registros anteriores permanecem com resultados vazios. A API precisa receber essa versão antes de o novo modo funcionar no app.

Sessões em andamento ficam na memória, isoladas pela conta e removidas no logout. Voltar entre telas permite retomar, mas encerrar o processo do app perde uma sessão não enviada. Falha de envio mantém a sessão na memória para nova tentativa. O histórico concluído fica no banco e aparece ao abrir a ficha (últimas 20 sessões), em Minha evolução, com detalhes recolhidos por sessão. Durante o treino, a última carga é localizada pelo identificador do exercício, preservando a distinção entre zero e carga não informada. A conclusão apresenta duração, total de exercícios e séries e as cargas retornadas pela API. Nenhum dado de treino fictício faz parte das telas do produto.
