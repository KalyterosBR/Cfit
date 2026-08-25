# Fechamento das fundações operacionais

Este documento registra entregas internas já existentes. “Implementado” significa fluxo e contrato presentes no Cfit; não substitui homologação com fornecedor, equipamento ou infraestrutura definitiva.

## Produto e operação

- CRM com etapas, origem, próxima ação, perda e conversão em aluno;
- Turmas com capacidade, espera, promoção, presença e cancelamento;
- Portal com dados próprios, treino, financeiro, acessos, avaliações, documentos e reservas;
- documentos com versão, validade e aceite interno auditável;
- campanhas com consentimento, fila, tentativas, sandbox e adaptadores;
- dispositivos com webhook autenticado, idempotência, heartbeat, diagnóstico e comandos;
- segurança com JWT, Turnstile, 2FA, sessões, troca/recuperação e transferência de propriedade;
- financeiro com cobranças, pagamento, recorrência, conciliação, caixa, inconsistências e webhooks;
- relatórios com escopo, período, retenção, comparação, CSV e preferências pessoais;
- Dashboard com dados reais disponíveis, metas, visão por função e personalização básica;
- tema antes do primeiro frame, estados compartilhados e consistência claro/escuro;
- health check, request ID, rotinas operacionais e runbook.

## Qualidade validada em 25/08/2026

- 116 testes Django;
- 9 testes frontend;
- TypeScript e build aprovados;
- lint sem erros e com 5 avisos conhecidos;
- nenhuma migração pendente.

## Não encerrado externamente

- homologação física Topdata/Control iD;
- Turnstile, SMTP, WhatsApp e gateway em ambiente definitivo;
- DNS, HTTPS, proxy, backup externo e alertas;
- particionamento histórico completo por unidade;
- screenshots autenticados e homologação humana de todos os perfis;
- assinatura eletrônica qualificada.

As próximas prioridades estão em [roadmap.md](roadmap.md) e os cenários de liberação em [homologacao-final.md](homologacao-final.md).
