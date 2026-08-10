# CFIT - Princípios da Arquitetura

> Este documento define as regras de desenvolvimento do CFIT.
> Sempre que houver dúvida sobre uma decisão técnica, consulte este documento antes de implementar.

---

# 1. Regras do Sistema

As regras técnicas pertencem ao CFIT e não podem ser alteradas pela academia.

Exemplos:

- CPF único.
- Integridade dos dados.
- Logs obrigatórios.
- Auditoria.
- Permissões.
- Segurança.
- Relacionamentos entre entidades.

---

# 2. Regras da Academia

As regras comerciais pertencem à academia e devem ser configuráveis.

Exemplos:

- Cobrar matrícula.
- Valor da matrícula.
- Fidelidade.
- Multa por quebra de fidelidade.
- Congelamento.
- Dias permitidos.
- Horários permitidos.
- Quantidade de check-ins.
- Benefícios do plano.
- Reajuste de mensalidades.
- Promoções.

---

# 3. Configuração antes de Programação

Sempre que possível:

Não criar regras fixas.

Criar configurações.

---

# 4. Simplicidade

Não criar abstrações sem necessidade.

Toda abstração deve resolver um problema real.

---

# 5. Módulos

Nenhum módulo nasce vazio.

O módulo só é criado quando houver desenvolvimento.

---

# 6. Arquitetura

Todo módulo deve seguir a arquitetura oficial do CFIT.


module/
│
├── api/
├── models/
├── services/
├── validators/
├── migrations/
│
├── serializers.py
├── selectors.py
├── admin.py
├── apps.py
├── constants.py
└── init.py


---

# 7. Filosofia

O CFIT deve se adaptar à academia.

A academia não deve precisar se adaptar ao CFIT.

Sempre que surgir uma nova regra de negócio, a primeira pergunta deve ser:

> Isso é uma regra do sistema ou uma regra da academia?

Se for uma regra da academia, ela deve ser configurável.
