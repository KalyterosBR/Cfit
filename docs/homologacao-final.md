# Homologação final do Cfit

Registre ambiente, responsável, data, evidência e resultado de cada cenário. Testes automatizados complementam, mas não substituem, homologação visual, física ou de fornecedor.

## Segurança e perfis

- login, Turnstile, refresh, logout e expiração;
- manter conectado nos dois storages;
- recuperação, troca obrigatória e 2FA;
- listagem/revogação de sessões;
- Proprietário, Administrador, Gerente, Recepção, Professor, Financeiro e Aluno;
- tentativa de abrir rota e API sem capacidade;
- isolamento entre academias, unidades e alunos do Portal.

## Fluxos operacionais

- aluno: cadastro, edição, busca, filtros, segmentos, inativação e reativação;
- matrícula: prévia, aceite, cobranças, renovação, congelamento e cancelamento;
- financeiro: pagamento, lote, conciliação, cancelamento, recorrência, caixa e inconsistência;
- acesso: permitido, bloqueado, contingência, política e evento idempotente;
- agenda: conflito da primeira e de ocorrências futuras;
- treinos e avaliações: prescrição, execução, evolução e revisão;
- Comercial/Turmas: lead, perda, conversão, capacidade, espera, chamada e cancelamento;
- documentos: versão, validade, aceite e isolamento;
- Portal: planos, cobranças, check-ins, avaliações, treino, reserva e dados próprios;
- relatórios: período, escopo, exportação, comparação e visão salva;
- temas: primeiro frame claro/escuro, hard reload, foco, modais, tabelas e skeletons;
- desktop amplo, notebook, tablet e móvel.

## Integrações externas

- Turnstile com domínio e chaves definitivas;
- SMTP com autenticação/reputação do domínio;
- WhatsApp e templates aprovados;
- gateway: Pix/cartão/boleto, baixa, estorno, recorrência e webhook;
- cada modelo Topdata/Control iD, chave rotacionada, comandos e fila offline;
- backup externo e restauração cronometrada;
- HTTPS, DNS, proxy, rate limiting, logs e alertas.

## Critério de liberação

Não liberar comercialmente com falha de isolamento, pagamento inconsistente, perda de histórico, acesso indevido ou restauração de backup não comprovada. Pendências externas devem estar visíveis e não podem ser descritas como concluídas por simulação.
