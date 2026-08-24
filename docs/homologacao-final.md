# Homologação final do Cfit

## Fluxos internos obrigatórios

- Login, renovação, 2FA, troca e recuperação de senha.
- Perfis Proprietário, Administração, Gerência, Recepção, Professor, Financeiro e Aluno.
- Cadastro de aluno, plano, matrícula, cobrança, pagamento e cancelamento.
- Check-in permitido, bloqueado, contingência e evento idempotente de equipamento.
- Lead, mudança de etapa, visita, proposta e conversão.
- Turma, capacidade, lista de espera, cancelamento e chamada.
- Portal: treino, financeiro, check-ins, reserva e aceite de documento.
- Campanha sandbox, falha, repetição e confirmação de entrega.
- Comparação entre unidades, relatórios e exportações.

## Validações externas

- Cloudflare Turnstile com chaves do domínio definitivo.
- SMTP transacional e reputação/autenticação do domínio remetente.
- WhatsApp homologado pelo provedor e templates aprovados pela Meta.
- Gateway financeiro em homologação: Pix, boleto/cartão, pagamento, estorno e assinatura de webhook.
- Cada modelo de catraca/leitor usando chave rotacionada e fila offline.
- Backup automatizado em armazenamento externo e restauração cronometrada.
- HTTPS, DNS, proxy, limites de requisição, logs e alertas do ambiente definitivo.

Registre evidência, responsável, data e resultado de cada cenário antes da liberação comercial.
