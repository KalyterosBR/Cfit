# Entidade: Aluno

Representa a pessoa atendida pela academia.

Campos atuais relevantes:

- academia e unidade;
- nome e nome normalizado para busca;
- CPF obrigatório na API atual e único globalmente; o modelo mantém nulabilidade apenas por compatibilidade histórica;
- telefone e data de nascimento obrigatórios na API atual; e-mail opcional;
- identificador externo único para evolução do controle de acesso;
- consentimentos de e-mail e WhatsApp;
- endereço e contato de emergência;
- vínculo opcional com usuário do Portal;
- estado ativo e timestamps herdados de `BaseModel`.

## Regras

- o cadastro operacional exige nome, CPF válido com 11 dígitos, telefone com DDD e data de nascimento não futura;
- busca por nome ignora acentos e caixa; CPF também pode ser pesquisado;
- aluno pode possuir múltiplas matrículas, preservadas historicamente;
- inativação não exclui ficha, cobranças, matrículas ou check-ins;
- o aluno só acessa o Portal através do `portal_user` vinculado;
- endpoints validam academia e unidade da sessão, não apenas IDs enviados pelo cliente.

## Informações derivadas

Plano atual/próximo vencimento, situação financeira e Health Score são derivados por fontes compartilhadas. Não persistir versões concorrentes desses cálculos no frontend.
