## Entidade: Aluno

Representa os alunos cadastrados na academia.

### Campos

- id
- academia_id
- nome
- cpf
- telefone
- email (opcional)
- data_nascimento
- cep
- rua
- numero
- complemento
- bairro
- cidade
- estado
- foto
- restricoes_medicas
- observacoes
- status
- data_cadastro

### Regras

- O CPF é obrigatório.
- O CPF deve ser único dentro da academia.
- O aluno pertence à academia, e não à unidade.
- O aluno pode possuir várias matrículas ativas.
- O aluno possui apenas uma foto de perfil.
- O e-mail é opcional.
- O endereço é armazenado separadamente.
- O sistema deve validar o CPF no cadastro.
- O aluno pode ser inativado, mas nunca excluído.
