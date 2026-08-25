# Arquitetura do Cfit — referência histórica e atual

Este arquivo era a primeira visão arquitetural do projeto. A referência canônica atual é [architecture/overview.md](architecture/overview.md).

Princípios que permanecem válidos:

- segurança e auditabilidade;
- evolução incremental;
- código legível e responsabilidades claras;
- preparação para múltiplas academias e unidades;
- histórico operacional preservado;
- interface responsiva e consistente.

Evoluções desde a versão inicial:

- o frontend é React + TypeScript + Vite, não Django Templates;
- a API Django REST Framework é privada por padrão e usa JWT;
- existem módulos funcionais para todos os principais domínios operacionais;
- RBAC, unidade ativa, Portal do aluno, automações e integrações possuem fundações próprias;
- temas claro/escuro usam tokens e bootstrap antes da renderização.

Entidades principais documentadas:

- [Academia e unidade](entidades/academia.md)
- [Usuário e vínculo](entidades/usuario.md)
- [Aluno](entidades/aluno.md)
- [Matrícula](entidades/matricula.md)
