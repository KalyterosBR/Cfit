# Entidade: Matrícula

Representa o vínculo comercial e temporal entre aluno e plano.

Campos atuais relevantes:

- aluno, plano e unidade;
- preço original, preço contratado, desconto e justificativa;
- início, vencimento e forma de cobrança;
- estado: ativa, congelada, cancelada, encerrada ou vencida;
- snapshot, versão, data e responsável pelo aceite contratual;
- criador, observações e motivo de cancelamento;
- congelamento até uma data e vínculo com matrícula renovada.

## Regras

- aluno pode possuir mais de uma matrícula, mas não duas ativas/congeladas para o mesmo plano;
- preço e contrato aceitos são preservados mesmo que o plano seja alterado;
- prévia comercial deve coincidir com as cobranças geradas;
- renovação, congelamento e cancelamento preservam histórico;
- cancelamento exige motivo no fluxo operacional;
- relacionamentos críticos usam proteção contra exclusão destrutiva;
- disponibilidade e escopo por unidade evoluem sem contaminar dados de outra academia.

Históricos e auditorias comerciais complementam o estado atual da matrícula.
