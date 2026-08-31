# Guia de estudo e apresentação — Cfit

## 1. Resumo em uma frase

O Cfit é uma plataforma web de gestão para academias que centraliza alunos, planos, matrículas, financeiro, acessos, agenda, treinos e operação diária em uma experiência integrada, responsiva e orientada a decisões.

## 2. Como apresentar o nome e a proposta

**Nome do projeto:** Cfit  
**Posicionamento:** tecnologia, performance e gestão premium.  
**Ideia central:** o Cfit acompanha a performance da academia, não apenas seus registros administrativos.

Uma forma simples de explicar:

> O Cfit foi criado para reduzir a fragmentação da gestão de academias. Em vez de controlar alunos, cobranças, acessos, turmas e pendências em ferramentas separadas, a academia acompanha toda a operação em um único sistema.

## 3. Problema que o sistema resolve

Uma academia precisa acompanhar simultaneamente:

- cadastro e histórico dos alunos;
- planos, contratos e matrículas;
- cobranças, pagamentos e inadimplência;
- check-ins e regras de acesso;
- agenda, profissionais e turmas;
- treinos e avaliações físicas;
- relacionamento, retenção e oportunidades comerciais;
- documentos e aceite do aluno;
- unidades, equipe, permissões e auditoria;
- pendências que exigem ação imediata.

Quando essas informações ficam separadas, surgem problemas como dados contraditórios, tarefas esquecidas, dificuldade para encontrar responsáveis e decisões baseadas em informações incompletas.

O Cfit resolve isso conectando os módulos e transformando registros em contexto operacional: o usuário não vê apenas um problema, mas também sua causa, prioridade e próxima ação.

## 4. Público do sistema

O sistema foi projetado para academias com diferentes funções de trabalho:

- proprietário;
- administrador;
- gerente;
- recepção;
- professor;
- financeiro;
- aluno, por meio de um portal separado.

Cada perfil recebe capacidades compatíveis com sua função. A autorização é validada pelo backend, e o frontend também oculta módulos e ações indisponíveis.

## 5. Principais módulos

### Homepage e autenticação

A rota pública apresenta o produto e direciona o cliente para uma página exclusiva de login.

O login utiliza:

- Cloudflare Turnstile para reduzir acessos automatizados;
- JWT para autenticação;
- access token com renovação por refresh token;
- opção “Manter conectado”;
- recuperação e redefinição de senha;
- troca obrigatória da senha inicial;
- suporte à verificação em duas etapas.

O token do Turnstile é validado no backend antes da emissão do JWT.

### Dashboard

O Dashboard oferece uma leitura rápida da academia, com indicadores financeiros, alunos, check-ins, metas e itens que exigem atenção.

Seu objetivo não é apenas mostrar números, mas ajudar o gestor a identificar prioridades. As consultas respeitam as permissões do perfil: quem não pode acessar dados financeiros, por exemplo, não deve nem disparar essas requisições.

### Gestão de alunos

O módulo permite:

- cadastrar e editar alunos;
- pesquisar por nome ou CPF;
- segmentar e filtrar a base;
- ativar e inativar cadastros sem apagar o histórico;
- consultar situação financeira, plano, frequência e outras informações operacionais.

O CPF é único e o cadastro preserva o histórico do aluno.

### Ficha 360º do aluno

A ficha reúne a jornada do aluno em um único local:

- dados pessoais e contatos;
- resumo operacional;
- matrículas e planos;
- cobranças e situação financeira;
- check-ins;
- treinos;
- avaliações físicas;
- documentos;
- linha do tempo e histórico.

Esse é um dos principais diferenciais do Cfit, porque reduz a necessidade de navegar por várias telas para entender a situação de uma pessoa.

### Planos e matrículas

Os planos possuem dados comerciais estruturados, como:

- valor e duração;
- periodicidade e parcelas;
- recorrência;
- taxa de matrícula;
- fidelidade e renovação;
- benefícios e modalidades;
- regras de acesso, cancelamento e congelamento;
- texto contratual.

A matrícula é guiada e apresenta uma prévia das cobranças. Valores já contratados são preservados quando um plano é alterado, protegendo o histórico comercial.

Também existem operações auditáveis de renovação, trancamento, reativação, encerramento e cancelamento.

### Financeiro

O módulo financeiro centraliza:

- cobranças paginadas e agrupadas;
- filtros por situação, vencimento, competência, plano e pagamento;
- pagamentos individuais e em lote;
- cancelamento com motivo;
- conciliação e identificação de divergências;
- exportação CSV;
- previsão de receita;
- entradas, saídas e fluxo de caixa;
- tentativas de recorrência;
- inconsistências com prioridade, causa e próxima ação;
- auditoria das movimentações.

As regras ficam no backend. O frontend apresenta e aciona essas operações, mas não mantém uma segunda versão da lógica financeira.

### Check-ins e equipamentos

O sistema registra acessos com origem manual, controle de acesso ou reconhecimento facial previsto na arquitetura.

O módulo inclui:

- histórico individual;
- monitor de acessos;
- políticas de liberação e bloqueio;
- contingência manual com motivo e responsável;
- equipamentos, heartbeat, latência e firmware;
- diagnóstico, comandos e histórico de falhas;
- simulador para desenvolvimento e homologação.

Integrações físicas reais dependem do fornecedor e de credenciais próprias. O simulador existente não deve ser apresentado como equipamento físico já homologado.

### Agenda e turmas

A Agenda possui visões por dia, semana e mês, com eventos, profissionais e locais.

As turmas oferecem:

- criação simples ou recorrente;
- verificação de conflitos de professor e sala;
- capacidade, vagas e ocupação;
- inscrições e lista de espera;
- promoção automática da primeira pessoa da espera;
- chamada com presença, falta ou cancelamento;
- cancelamento de ocorrência ou série;
- duplicação e reposição;
- sincronização entre Turmas e Agenda.

A criação recorrente valida a série antes de persistir, evitando criar apenas parte das ocorrências quando existe um conflito.

### Treinos e avaliações

O módulo de Treinos contém:

- biblioteca de exercícios;
- modelos reutilizáveis;
- prescrição para o aluno;
- séries, repetições e cargas;
- registro de sessões;
- aderência e evolução;
- revisão e impressão.

As avaliações físicas registram medidas e indicadores, permitem comparação histórica e podem ser vinculadas ao ciclo de revisão do treino.

### Comercial e relacionamento

A área comercial trabalha com:

- leads e etapas do funil;
- origem e responsável;
- próximas ações;
- contatos e histórico;
- propostas;
- conversão do lead em aluno.

Campanhas e segmentações possuem preparação controlada. O ambiente sandbox processa a lógica sem realizar contato externo. Envios reais dependem da configuração de provedores de e-mail ou WhatsApp.

### Documentos e portal do aluno

Documentos possuem:

- tipo, título e versão;
- validade e vencimento;
- exigência de aceite;
- histórico de versões;
- arquivamento com motivo;
- acesso autorizado ao arquivo.

O portal é isolado da área administrativa e apresenta somente informações do aluno autenticado, incluindo planos, financeiro, check-ins, avaliações, treinos, turmas e documentos.

### Central operacional

A Central operacional funciona como uma fila diária de trabalho.

Ela reúne pendências originadas em diferentes áreas, como:

- cobranças e recorrências;
- retenção de alunos;
- equipamentos;
- turmas;
- leads;
- documentos;
- automações.

Cada pendência pode ter prioridade, responsável, prazo, situação, resolução e histórico. Quando a causa deixa de existir na origem, a pendência pode ser resolvida automaticamente sem apagar seu histórico.

### Unidades, configurações e auditoria

O Cfit possui uma fundação multiunidade:

- unidades vinculadas à academia;
- seleção da unidade operacional ativa;
- isolamento gradual por academia e unidade;
- comparação de indicadores entre unidades;
- usuários, perfis e capacidades;
- sessões e segurança;
- configurações operacionais;
- auditoria administrativa.

O particionamento de todos os dados históricos por unidade ainda é incremental e não deve ser apresentado como totalmente concluído.

## 6. Fluxo principal do sistema

```text
Login protegido
↓
Dashboard e prioridades
↓
Cadastro do aluno
↓
Escolha do plano e matrícula
↓
Geração de cobranças
↓
Check-ins, agenda, treinos e avaliações
↓
Relacionamento, documentos e portal
↓
Relatórios, auditoria e Central operacional
```

Esse fluxo demonstra que os módulos não foram criados como páginas isoladas. Uma matrícula influencia o financeiro; pagamentos e frequência influenciam a leitura operacional; turmas aparecem na agenda; avaliações apoiam a revisão do treino; falhas relevantes alimentam a Central operacional.

## 7. Arquitetura técnica

O Cfit é um monorepositório com frontend e backend separados por responsabilidade.

```text
Navegador
↓
React + TypeScript + Vite
↓ requisições HTTP/JSON
Django REST Framework
↓
Serviços e regras de negócio
↓
PostgreSQL
```

### Backend

- Python 3.13;
- Django 5;
- Django REST Framework;
- PostgreSQL 17;
- SimpleJWT;
- django-filter;
- django-cors-headers.

O backend é dividido em aplicações de domínio, como `students`, `plans`, `enrollments`, `financial`, `checkins`, `schedule`, `workouts`, `operations`, `academy` e `users`.

### Frontend

- React 19;
- TypeScript;
- Vite;
- Tailwind CSS;
- shadcn/ui e Base UI;
- Axios e React Router;
- Recharts;
- Lucide React;
- react-hot-toast.

O frontend possui componentes compartilhados, páginas, funcionalidades por domínio, serviços HTTP e um layout interno responsivo.

### Infraestrutura

- Docker e Docker Compose no desenvolvimento;
- Git e GitHub para versionamento;
- Vercel para frontend e backend publicados;
- PostgreSQL gerenciado no Neon;
- migrations executadas no build do backend publicado.

## 8. Decisões importantes de engenharia

### API privada por padrão

O Django REST Framework exige autenticação globalmente. Apenas endpoints realmente públicos removem essa exigência de forma explícita.

### Backend como fonte de autorização

Ocultar um botão no frontend melhora a experiência, mas não representa segurança suficiente. Por isso, as APIs também verificam capacidades, academia e unidade da sessão.

### Preservação de histórico

Alunos, matrículas, pagamentos, cancelamentos e ações operacionais não devem desaparecer por exclusões destrutivas. O sistema privilegia mudança de estado, motivo e auditoria.

### Fonte única das regras

Regras financeiras e operacionais permanecem no backend. Isso reduz divergências entre páginas e impede que o frontend se torne uma segunda fonte de verdade.

### Evolução incremental

O projeto foi construído em etapas pequenas. Essa abordagem facilita aprendizado, testes e correções sem exigir uma reescrita completa a cada nova funcionalidade.

### Responsividade e temas

A interface funciona em desktop, tablet e celular. A área interna possui temas claro e noturno baseados em tokens semânticos compartilhados. Confirmações e ações sensíveis usam diálogos próprios do Cfit em vez das caixas nativas do navegador.

## 9. Segurança

Pontos que podem ser destacados na apresentação:

- validação server-side do Cloudflare Turnstile;
- autenticação JWT com renovação de sessão;
- rotação de refresh tokens;
- rotas privadas protegidas;
- capacidades verificadas no backend;
- isolamento por academia e contexto de unidade;
- troca obrigatória da senha inicial;
- recuperação com token individual e descartável;
- verificação em duas etapas;
- gerenciamento e revogação de sessões;
- secrets somente em variáveis de ambiente;
- HTTPS e cookies seguros em produção;
- webhooks autenticados e idempotentes;
- auditoria de ações administrativas e operacionais.

## 10. Diferenciais do Cfit

1. **Ficha 360º:** reúne toda a jornada do aluno.
2. **Central operacional:** transforma falhas dispersas em uma fila acionável.
3. **Integração entre módulos:** financeiro, acesso, agenda, treinos e relacionamento compartilham contexto.
4. **Explicabilidade:** pendências e indicadores apresentam causa e próxima ação.
5. **Preservação de histórico:** alterações importantes permanecem auditáveis.
6. **Permissões por capacidade:** cada perfil acessa apenas o necessário.
7. **Experiência premium:** identidade própria, responsividade e temas claro/noturno.
8. **Preparação para crescimento:** arquitetura multiacademia e multiunidade incremental.

## 11. Limitações e evoluções futuras

Uma apresentação técnica confiável deve reconhecer o que ainda depende de evolução:

- parte dos indicadores do Dashboard ainda pode ser demonstrativa e deve permanecer identificada dessa forma;
- integrações físicas com catracas e reconhecimento facial exigem fornecedor e homologação;
- envios reais de WhatsApp e e-mail dependem de provedores e credenciais;
- arquivos enviados à Vercel não possuem armazenamento durável; documentos e imagens em produção exigem armazenamento de objetos privado;
- o particionamento de todos os registros históricos por unidade ainda é incremental;
- aplicativo móvel próprio do aluno não faz parte do frontend atual;
- recorrência de turmas atende cenários diários e semanais, mas ainda não possui um editor avançado de séries;
- algumas áreas continuam evoluindo em profundidade analítica e integrações externas.

Essas limitações não anulam os módulos já implementados. Elas mostram que o projeto diferencia conscientemente uma base funcional de capacidades que dependem de infraestrutura ou evolução futura.

## 12. Roteiro sugerido para demonstração

Uma demonstração de 8 a 12 minutos pode seguir esta ordem:

1. **Homepage:** apresente a identidade e a proposta do produto.
2. **Login:** explique Turnstile, JWT e proteção das rotas.
3. **Dashboard:** mostre a visão geral e as prioridades.
4. **Alunos:** pesquise um aluno e abra sua ficha 360º.
5. **Ficha 360º:** percorra plano, financeiro, check-ins, treino, avaliações e histórico.
6. **Financeiro:** mostre filtros, cobrança, conciliação e inconsistências.
7. **Agenda e Turmas:** demonstre conflitos, ocupação, lista de espera e chamada.
8. **Central operacional:** mostre como diferentes módulos geram uma fila diária.
9. **Documentos e Portal:** apresente versão, validade, aceite e isolamento do aluno.
10. **Configurações:** finalize com unidades, perfis, segurança e auditoria.

Evite gastar tempo cadastrando muitos dados ao vivo. Prepare antes da apresentação registros fictícios que permitam mostrar estados diferentes: aluno regular, aluno em atenção, cobrança vencida, turma quase cheia e documento aguardando aceite.

## 13. Roteiro de fala de aproximadamente 3 minutos

> O Cfit é um sistema de gestão para academias desenvolvido com foco em tecnologia, performance e clareza operacional. O problema que ele resolve é a fragmentação: normalmente alunos, pagamentos, acessos, agenda, treinos e relacionamento são controlados em lugares diferentes.
>
> No Cfit, esses dados são conectados. O cadastro do aluno evolui para uma ficha 360 graus, onde a equipe consulta matrícula, situação financeira, check-ins, treino, avaliações, documentos e histórico. Isso permite entender rapidamente a situação do aluno sem alternar entre várias ferramentas.
>
> O financeiro possui cobranças, pagamentos, conciliação, recorrências, fluxo de caixa e uma central de inconsistências. A Agenda se integra às turmas, validando conflitos, capacidade, lista de espera e chamada. Falhas relevantes de diferentes módulos chegam à Central operacional com prioridade, responsável, prazo e próxima ação.
>
> Tecnicamente, o frontend foi construído com React e TypeScript, enquanto o backend utiliza Django REST Framework e PostgreSQL. A autenticação usa JWT e Cloudflare Turnstile, e as permissões são verificadas no backend. O ambiente de desenvolvimento usa Docker, e a publicação utiliza Vercel com banco PostgreSQL no Neon.
>
> O principal diferencial do projeto é não tratar cada módulo como uma tela isolada. O objetivo é transformar os dados da academia em uma operação integrada, explicável e acionável, preservando segurança, histórico e uma experiência responsiva nos temas claro e noturno.

## 14. Perguntas que podem surgir

### Por que usar Django no backend?

Django oferece uma base madura para autenticação, ORM, migrations, administração e segurança. O Django REST Framework facilita a construção da API, permissões, filtros, paginação e serialização.

### Por que React e TypeScript?

React facilita a criação de uma interface baseada em componentes e estados. TypeScript reduz erros ao definir contratos para dados, propriedades e respostas da API.

### Por que PostgreSQL?

O sistema possui muitos relacionamentos e precisa preservar consistência entre alunos, matrículas, cobranças, check-ins e histórico. PostgreSQL é adequado para essas regras relacionais e transações.

### Como o sistema evita acesso indevido?

As rotas exigem autenticação, o frontend envia o JWT nas requisições e o backend valida perfil, capacidades, academia e unidade. A interface ocultar uma ação é apenas uma conveniência; a decisão final é sempre da API.

### O sistema já envia WhatsApp ou controla catracas reais?

Existe preparação técnica, adaptadores, filas, webhooks e simuladores. A operação real depende da escolha do fornecedor, credenciais e homologação. Não deve ser apresentada como integração externa já contratada.

### Como o sistema trata alterações importantes?

Em vez de apagar registros, o Cfit preserva estados, motivos, responsáveis e histórico. Pagamentos, cancelamentos, matrículas e ações administrativas possuem trilhas auditáveis.

### O sistema suporta várias unidades?

Existe cadastro, seleção de unidade ativa, comparação e isolamento incremental. Alguns registros históricos ainda precisam receber particionamento completo por unidade mediante uma política explícita de migração.

### O projeto está pronto para produção?

Há infraestrutura de publicação, autenticação, segurança e módulos funcionais. Entretanto, uma produção comercial completa ainda exige decisões operacionais como armazenamento privado durável para arquivos, homologação de integrações externas, monitoramento e políticas de backup e suporte.

## 15. Conceitos para estudar antes da apresentação

Procure conseguir explicar com suas próprias palavras:

- diferença entre frontend, backend e banco de dados;
- o que é uma API REST;
- como funciona a autenticação JWT;
- diferença entre autenticação e autorização;
- função do Cloudflare Turnstile;
- o que são migrations;
- por que preservar histórico e auditoria;
- o que é responsividade;
- o que é arquitetura baseada em componentes;
- por que regras de negócio ficam no backend;
- como Docker padroniza o ambiente;
- como Git registra a evolução do projeto.

## 16. Checklist antes de apresentar

- confirme que frontend e backend publicados estão respondendo;
- faça login antes ou tenha as credenciais de demonstração disponíveis;
- use somente dados fictícios;
- confira se as migrations de produção foram aplicadas;
- teste as rotas que serão demonstradas;
- prepare um aluno com dados suficientes para a ficha 360º;
- prepare uma cobrança e uma pendência operacional;
- prepare uma turma e um documento;
- evite depender de uma integração externa durante a demonstração;
- mantenha este guia aberto como apoio;
- tenha uma captura de tela ou vídeo curto como plano alternativo.

## 17. Encerramento sugerido

> O Cfit demonstra como uma aplicação moderna pode conectar gestão administrativa, experiência do aluno e operação diária. A base atual já cobre os principais domínios de uma academia e foi construída para evoluir de forma gradual, segura e auditável, sem perder clareza para quem utiliza o sistema.

