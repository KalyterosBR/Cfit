# Princípios da arquitetura

## Regras do sistema e da academia

Regras de integridade, segurança, autorização, auditoria e isolamento pertencem ao Cfit. Regras comerciais e operacionais que variam por academia devem ser configuráveis quando houver necessidade real.

Exemplos de invariantes do sistema:

- identidade única e relacionamentos íntegros;
- backend como fonte de autorização;
- isolamento entre academias, unidades e alunos;
- preservação de histórico;
- secrets fora do código e do frontend;
- ações sensíveis auditáveis.

Exemplos configuráveis:

- tolerância financeira;
- condições de plano e fidelidade;
- regras de congelamento/cancelamento;
- política e horários de acesso;
- motivos operacionais;
- automações habilitadas.

Não transforme toda possibilidade futura em configuração antecipada. Configuração também tem custo de produto, validação e manutenção.

## Evolução incremental

- Entregue etapas pequenas, completas e testáveis.
- Não crie módulos vazios ou grandes abstrações preventivas.
- Preserve contratos funcionais durante a evolução.
- Migrações devem tratar dados existentes explicitamente.
- Multiunidade é uma evolução por domínio, não uma flag global presumida.

## Responsabilidades claras

Models preservam estado e invariantes; serializers validam contratos; selectors concentram consultas reutilizáveis; services executam operações; views autorizam e orquestram HTTP. No frontend, páginas compõem módulos, features concentram domínios e componentes compartilhados só existem quando há reutilização real.

Essa organização é uma orientação, não uma exigência de pastas vazias ou uma classe por arquivo.

## Fonte de verdade

- código e constraints: comportamento executável;
- testes: exemplos verificáveis do contrato;
- `docs/`: visão geral técnica e de produto;
- `AGENTS.md`: regras e estado operacional para desenvolvimento assistido;
- ADRs: decisões duráveis com alternativas relevantes.

Quando houver divergência, investigue antes de sobrescrever e atualize a documentação junto com a correção.

## Experiência e acessibilidade

O sistema deve explicar o que aconteceu, por que aconteceu e qual é a próxima ação. Carregamento, vazio, erro, bloqueio e falta de permissão não são o mesmo estado. Interface responsiva, foco visível, contraste e redução de movimento são requisitos, não acabamento opcional.

## Auditabilidade e integrações

Integrações devem tolerar repetição de eventos e expor diagnóstico sem vazar segredo. Simuladores comprovam contratos internos, não o comportamento do fornecedor. A homologação externa continua obrigatória.
