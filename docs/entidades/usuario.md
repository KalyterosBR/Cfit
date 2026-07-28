# Entidade: Usuário

Representa os funcionários que acessam o sistema.

### Campos

- id
- academia_id
- unidade_id
- nome
- cpf
- email
- senha
- perfil
- status
- data_cadastro
- ultimo_acesso

### Regras

- Cada usuário pertence a uma academia.
- Cada usuário pertence inicialmente a uma única unidade.
- O login poderá ser feito com CPF ou e-mail.
- CPF e e-mail devem ser únicos.
- Um administrador pode criar outro administrador.
- Apenas administradores podem redefinir senhas.
- O Super Administrador pode acessar academias para suporte.
- Todas as ações importantes devem ser registradas em auditoria.