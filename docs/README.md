# Documentação geral do Cfit

Esta pasta é a documentação geral do produto e da implementação. O código é a fonte de verdade para contratos executáveis; o `AGENTS.md` concentra regras operacionais para desenvolvimento assistido. Em caso de divergência, confira o código atual e corrija a documentação junto com a mudança.

## Visão do produto

O Cfit é uma plataforma web de gestão para academias, estúdios e unidades fitness. Seu posicionamento é **tecnologia + performance + gestão premium**: conecta dados operacionais e financeiros para orientar decisões e próximas ações, sem se limitar a cadastros administrativos.

Áreas funcionais atuais:

- homepage, login JWT e Cloudflare Turnstile;
- Dashboard operacional com visões por função e preferências pessoais;
- alunos, ficha 360º, Health Score e retenção;
- planos, matrículas, contratos e histórico;
- cobranças, pagamentos, recorrência, conciliação, caixa e inconsistências;
- check-ins, políticas de acesso, contingência e dispositivos;
- treinos, avaliações e agenda unificada;
- relatórios gerenciais e comparação de unidades;
- usuários, capacidades, sessões, auditoria e configurações;
- automações, campanhas, Comercial e Turmas;
- documentos e Portal isolado do aluno;
- onboarding e Central operacional.

## Mapa da documentação

| Documento | Conteúdo |
| --- | --- |
| [Ambiente de desenvolvimento](ambiente_desenvolvimento.md) | Setup oficial com Docker no workspace WSL |
| [Visão da arquitetura](architecture/overview.md) | Componentes, fluxos e limites arquiteturais |
| [Princípios](architecture/principles.md) | Regras duráveis de modelagem e evolução |
| [Infraestrutura](arquitetura/infraestrutura.md) | Serviços locais e desenho de produção |
| [Módulos](modules/README.md) | Estado e responsabilidade de cada domínio |
| [Padrões de API](api/standards.md) | Autenticação, paginação, filtros e erros |
| [Convenções backend](backend/conventions.md) | Organização e validação do Django |
| [Convenções frontend](frontend/conventions.md) | React, tema, estados e acessibilidade |
| [Design system](design-system.md) | Identidade, tokens, componentes e motion |
| [Entidades](entidades/) | Academia, usuário, aluno e matrícula |
| [Operação em produção](operacao-producao.md) | Saúde, rotinas, deploy e recuperação |
| [Homologação final](homologacao-final.md) | Cenários internos e integrações externas |
| [Roadmap atual](roadmap.md) | Prioridades restantes e dependências |
| [Fechamento anterior](roadmap-fechamento.md) | Entregas internas já consolidadas |
| [Decisões](decisions/README.md) | Índice para decisões arquiteturais duráveis |

## Estado validado

Última consolidação: **25/08/2026**, commit `ad5dbc6`.

- suíte Django: 116 testes aprovados;
- frontend: 9 testes aprovados;
- lint: sem erros, com 5 avisos conhecidos de dependências de hooks;
- TypeScript e build Vite: aprovados;
- `manage.py check`: aprovado;
- nenhuma migração pendente.

Esses números são um retrato da validação registrada, não uma garantia permanente. Execute novamente as verificações após qualquer alteração.

## Limites importantes

- Topdata, Control iD, WhatsApp, SMTP, gateway financeiro e Turnstile exigem homologação com credenciais/infraestrutura reais.
- A fundação multiunidade existe, mas nem todo dado histórico está completamente particionado por unidade.
- Visões salvas de relatórios e preferências do Dashboard são pessoais no navegador; compartilhamento server-side ainda é futuro.
- Aceite interno de documento não deve ser chamado de assinatura eletrônica qualificada.
- Não há suíte de screenshots autenticados configurada; a homologação visual humana continua necessária.

## Como manter esta documentação

1. Atualize a página temática junto com a mudança funcional.
2. Documente decisões duráveis, não um diário de commits.
3. Não marque integração externa como concluída apenas porque existe simulador ou adaptador.
4. Não copie secrets, tokens ou dados pessoais para exemplos.
5. Preserve histórico útil, indicando claramente quando um documento foi superado.
