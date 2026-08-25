# Entidades: Academia e Unidade

## Academia

Representa o cliente organizacional do Cfit.

Campos atuais relevantes:

- nome e nome fantasia;
- CNPJ opcional e único quando informado;
- telefone, e-mail e logo;
- tipo de estabelecimento, faixa de tamanho e objetivo principal;
- conclusão do onboarding;
- estado ativo;
- timestamps e UUID herdados de `BaseModel`.

## Unidade

Representa uma filial operacional vinculada à academia.

- nome, código, endereço e telefone;
- código único dentro da academia;
- estado ativo herdado de `BaseModel` quando aplicável ao contrato exposto;
- utilizada como contexto ativo do vínculo `AcademyUser`.

## Configurações operacionais

`AcademyOperationalSettings` concentra tolerância financeira, motivos configuráveis, horários e ativação de automações.

## Regras

- nenhuma unidade pode pertencer a outra academia durante troca de contexto;
- isolamento por academia é obrigatório;
- a fundação multiunidade não significa particionamento completo de todas as tabelas históricas;
- migrações de domínios para unidade precisam definir tratamento dos registros existentes;
- criação e alteração relevantes alimentam auditoria administrativa.
