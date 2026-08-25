# Roadmap atual do Cfit

Este documento resume as próximas prioridades após a consolidação de 25/08/2026. Não autoriza execução em lote: cada item precisa de escopo, inspeção do código, critérios de aceite e testes próprios.

## Prioridade recomendada

1. **Homologar RBAC por perfil** — validar Proprietário, Administrador, Gerente, Recepção, Professor e Financeiro com contas reais, rotas diretas e ações sensíveis.
2. **Completar particionamento por unidade** — migrar e filtrar com segurança os dados históricos ainda não vinculados à unidade.
3. **Homologar dispositivos físicos** — testar Topdata e Control iD reais, comandos, heartbeat, fila offline, contingência e latência.
4. **Persistir relatórios salvos no backend** — visões por usuário, compartilhamento controlado, padrão e auditoria.
5. **Personalização avançada do Dashboard** — reordenação, indicadores favoritos e padrões administrativos por perfil/unidade.
6. **Evoluir documentos** — upload, armazenamento privado, download autorizado, obrigatoriedade e alertas sem duplicidade.
7. **Fortalecer aceite/assinatura** — evidências, imutabilidade de versões e integração com matrícula/acesso; assinatura qualificada somente com solução apropriada.
8. **Evoluir Portal do aluno** — dados pessoais completos, avaliações detalhadas, contratos, comprovantes e recuperação de acesso.
9. **Implementar notificações reais** — persistência, leitura, preferência e destinos para financeiro, documentos, turmas e operação.
10. **Completar navegação personalizada** — atalhos, módulos mais usados e redefinição de preferências sem expor rotas proibidas.

## Dependências

```text
RBAC + unidade confiável
  ├─ relatórios compartilhados
  ├─ Dashboard por perfil/unidade
  ├─ documentos e notificações
  └─ homologação operacional segura

Documentos + autenticação do aluno
  └─ Portal ampliado
```

## Entregas já consolidadas

- tema claro/escuro antes da renderização e skeletons compartilhados;
- Health Score, situação financeira e próximo vencimento compartilhados;
- planos, matrícula guiada, financeiro central e inconsistências;
- alunos com segmentos operacionais;
- agenda recorrente com validação de toda a série;
- treinos, automações, Comercial, Turmas, Documentos e Portal funcionais;
- comparação de unidades e metas auditadas;
- favoritos de navegação, personalização básica do Dashboard e relatórios pessoais locais.

## Itens externos

Turnstile definitivo, SMTP, WhatsApp, gateway financeiro, dispositivos, DNS/HTTPS, backups externos e alertas precisam de homologação fora do ambiente local. Não marcar como concluídos com base apenas em adaptadores ou simuladores.
