# Fechamento dos 28 pontos do roadmap

Esta lista registra o critério técnico entregue. “Concluído internamente” significa que existe fluxo persistido, permissão e contrato testável no Cfit; não substitui homologação com fornecedores.

1. CRM: cadastro e edição de oportunidades.
2. CRM: etapas, próxima ação, perda com motivo e auditoria.
3. CRM: conversão segura em aluno.
4. CRM: totais e taxa de conversão.
5. Turmas: criação, capacidade e inscrição.
6. Turmas: lista de espera e promoção automática.
7. Turmas: chamada com presença, ausência e cancelamento.
8. Turmas: cancelamento coletivo e duplicação de horário.
9. Portal: planos, cobranças, check-ins, avaliações e treino.
10. Portal: reserva e cancelamento de aulas.
11. Portal: atualização limitada de contato.
12. Documentos: operação administrativa pesquisável por aluno.
13. Documentos: versões automáticas, validade e alertas.
14. Documentos: aceite digital com data, nome e IP.
15. Comunicação: sandbox, e-mail Django e WhatsApp HTTP.
16. Comunicação: templates e agendamento persistidos.
17. Comunicação: tentativas, reprocessamento e webhook de entrega.
18. Dispositivos: webhook autenticado e idempotente.
19. Dispositivos: heartbeat, diagnóstico e detecção de offline.
20. Segurança: 2FA por código de e-mail.
21. Segurança: listagem e revogação de sessões JWT.
22. Governança: transferência transacional de propriedade.
23. Segurança: bloqueio temporário após tentativas de login.
24. Pagamentos: contrato sandbox/HTTP para Pix e link de pagamento.
25. Pagamentos: webhook autenticado e idempotente para baixa/estorno.
26. Relatórios: receita, inadimplência, retenção, conversão, ocupação, documentos e unidades.
27. Produção: health check, request ID, rotina operacional e runbook de backup/deploy.
28. Qualidade: CI, testes automatizados e roteiro final de homologação.

## Limite da conclusão interna

Turnstile, SMTP, WhatsApp, gateway financeiro, catracas, DNS/HTTPS, armazenamento de backup e alertas exigem contas ou infraestrutura externas. Os contratos e adaptadores estão no Cfit, mas a aprovação final depende dos cenários descritos em `homologacao-final.md`.
