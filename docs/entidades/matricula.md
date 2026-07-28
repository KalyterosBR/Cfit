## Entidade: Matrícula

Representa o vínculo entre um aluno e um plano.

### Campos

- id
- aluno_id
- plano_id
- unidade_id
- valor_contratado
- data_inicio
- data_vencimento
- status
- forma_cobranca
- observacoes

### Regras

- Um aluno pode possuir várias matrículas.
- Cada matrícula possui seu próprio histórico.
- O valor contratado é preservado, mesmo que o plano seja alterado futuramente.
- A matrícula pode ser:
  - Ativa
  - Congelada
  - Cancelada
  - Encerrada
  - Vencida