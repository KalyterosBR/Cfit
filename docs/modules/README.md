# Módulos do Cfit

| Domínio | Backend/API | Rota web | Estado atual |
| --- | --- | --- | --- |
| Autenticação e usuários | `/api/auth/`, `/api/users/` | `/`, `/change-password` | JWT, Turnstile, refresh, recuperação, 2FA, sessões, RBAC e auditoria |
| Academias e unidades | `/api/academies/` | `/units`, `/settings` | cadastro, unidade ativa, configurações e comparação |
| Alunos | `/api/students/` | `/students`, `/students/:id` | busca, segmentos, ficha 360º, Health Score e retenção |
| Planos | `/api/plans/` | `/plans` | condições comerciais, recorrência, acesso e contrato |
| Matrículas | `/api/enrollments/` | ficha do aluno | criação guiada, histórico, renovação, congelamento e cancelamento |
| Financeiro | `/api/financial/` | `/finance` | cobranças, pagamento, lote, conciliação, recorrência, caixa, metas e inconsistências |
| Check-ins | `/api/checkins/` | `/checkins` | consulta, resumo, política, bloqueio e contingência |
| Treinos | `/api/workouts/` | `/workouts` | biblioteca, modelos, prescrição, sessões e evolução |
| Agenda | `/api/schedule/` | `/schedule` | dia/semana/mês, recorrência, confirmação e conflitos da série |
| Automações | `/api/automations/` | `/automations` | regras, execução, SLA, tentativas e idempotência |
| Operações | `/api/operations/` | `/operations` | dispositivos, campanhas, avaliações e onboarding operacional |
| Comercial e Turmas | `/api/operations/leads/`, `/classes/` | `/growth` | funil, conversão, capacidade, espera, presença e cancelamento |
| Documentos | `/api/operations/documents/` | `/documents` | versão, validade, aceite e criação de acesso ao portal |
| Relatórios | `/api/reports/` e resumos dos domínios | `/reports` | período/escopo, indicadores, retenção, CSV, favoritos e visões pessoais locais |
| Portal do aluno | `/api/users/portal/me/` | `/portal` | planos, turmas, treino, financeiro, check-ins, avaliações, documentos e dados próprios |
| Dashboard | APIs resumidas dos domínios | `/dashboard` | dados reais disponíveis, metas, visões por função e preferências pessoais |
| Onboarding | academia e operações | `/onboarding` | checklist derivado do estado real e contexto por perfil |

## Rotas protegidas

Rotas administrativas usam `ProtectedRoute` e `CapabilityRoute`. O Portal exige `portal.view`. O backend sempre repete a validação de autorização.

## Integrações não homologadas internamente

Adaptadores para comunicação, pagamento e dispositivos permitem desenvolvimento e testes, mas a ativação real depende de fornecedor, credenciais, infraestrutura, segurança e evidência de homologação.
