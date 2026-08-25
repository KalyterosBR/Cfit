# Entidades: Usuário e vínculo com academia

## Usuário

`users.User` é o modelo de autenticação do Django.

- login por e-mail único;
- telefone e foto opcionais;
- troca obrigatória de senha quando `must_change_password`;
- marcação de conta exclusiva do Portal;
- opção de 2FA;
- senha armazenada somente pelo mecanismo seguro do Django.

## AcademyUser

Vincula usuário e academia e define:

- perfil: Proprietário, Administrador, Gerente, Recepção, Professor ou Financeiro;
- unidade ativa;
- vínculo ativo;
- data de entrada;
- unicidade do par academia/usuário.

Capacidades são derivadas no backend a partir do perfil. Proprietário e Administrador possuem todas as capacidades na matriz atual; os demais recebem conjuntos operacionais específicos. Contas administrativas antigas sem vínculo possuem compatibilidade temporária documentada no código.

## Portal do aluno

Conta marcada como `is_student_portal` recebe somente `portal.view` e é vinculada por `Student.portal_user`. Ela não herda acesso administrativo.

## Auditoria e sessões

Alterações administrativas relevantes usam `AdministrativeAudit`, com ator, ação, entidade, estados anterior/novo, motivo, origem e data. Sessões JWT podem ser listadas e revogadas; transferência de propriedade é uma ação sensível e transacional.
