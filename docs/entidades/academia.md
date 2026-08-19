## Entidade: Academia

Representa cada cliente que utiliza o CFIT.

### Campos

- id
- tipo_documento
- documento
- nome
- nome_fantasia
- telefone
- email
- status
- plano_cfit
- data_cadastro
- data_vencimento_assinatura

### Regras

- O documento pode ser CPF ou CNPJ.
- Uma academia pode possuir várias unidades.
- Uma academia pode possuir vários administradores.
- Apenas o Super Administrador do CFIT pode criar academias.
- Após o vencimento, existe tolerância de 7 dias.
- Após a tolerância, o sistema entra em modo somente leitura.