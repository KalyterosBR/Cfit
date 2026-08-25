# Padrões da API

## Convenções gerais

- Prefixo: `/api/`.
- JSON como formato padrão.
- APIs privadas usam JWT por padrão.
- Identificadores são UUIDs onde os modelos herdam de `BaseModel`.
- Datas usam `YYYY-MM-DD`; datetimes usam ISO 8601 com fuso.
- Valores monetários são transmitidos como strings decimais quando serializados pelo DRF.
- Nomes de campos e valores internos ficam em inglês; textos apresentados ao usuário ficam em português.

## Autenticação

```text
POST /api/auth/login/
POST /api/auth/refresh/
```

O login recebe `email`, `password` e `turnstile_token`. O token Turnstile é validado no backend. Tokens JWT ou Turnstile nunca devem aparecer em logs.

Endpoints públicos existentes, como reset de senha e webhooks, declaram permissões e validações próprias explicitamente.

## Paginação, busca e ordenação

A paginação padrão retorna:

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/students/?page=2",
  "previous": null,
  "results": []
}
```

O tamanho padrão é 10. Parâmetros comuns:

- `page` para paginação;
- `search` para busca;
- `ordering` para ordenação;
- filtros específicos do domínio, documentados no respectivo serviço/frontend.

Não exponha um filtro no frontend sem confirmar que o backend o aceita. Segmentos da lista de alunos são um contrato explícito do `StudentViewSet`.

## Respostas e erros

- `200`: consulta ou alteração concluída;
- `201`: recurso criado;
- `204`: operação concluída sem corpo;
- `400`: dados inválidos ou regra de negócio;
- `401`: sessão ausente ou inválida;
- `403`: usuário autenticado sem capacidade;
- `404`: recurso inexistente dentro do escopo autorizado;
- `409` pode ser usado para conflito operacional explícito quando adotado pelo domínio.

Erros de validação devem apontar campos quando possível:

```json
{
  "due_date": ["A data de vencimento não pode anteceder o início."]
}
```

Não exponha stack trace, segredo, credencial de dispositivo ou detalhes internos desnecessários.

## Escopo e autorização

Nunca confie em `academy`, `unit`, `student` ou usuário apenas porque vieram no payload. A view deve derivar academia e unidade da sessão e validar relações antes de salvar ou consultar.

Leitura e escrita podem exigir capacidades diferentes por meio de `ScopedCapability`. O frontend não substitui essa validação.

## Ações e histórico

Ações REST adicionais usam nomes operacionais claros, por exemplo:

```text
POST /api/financial/charges/:id/pay/
POST /api/financial/charges/:id/cancel/
POST /api/operations/devices/:id/diagnose/
POST /api/operations/leads/:id/convert/
```

Operações sensíveis devem exigir confirmação/motivo no contrato quando aplicável e alimentar auditoria ou histórico.

## Webhooks

Webhooks validam segredo ou chave do dispositivo, rejeitam eventos inválidos e preservam idempotência. A resposta a um evento repetido não pode repetir o efeito de negócio.

## Endpoints por domínio

Consulte [Módulos](../modules/README.md) para os prefixos atuais e [Homologação](../homologacao-final.md) para cenários críticos.
