# Indentação e Hierarquia

## Objetivo

Entender como diferentes tecnologias representam relações entre elementos.

---

# O que é hierarquia?

Hierarquia é uma relação de "pai" e "filho".

Um elemento pode possuir outros elementos dentro dele.

Exemplo:

Projeto
├── Módulo
│   ├── Classe
│   │   ├── Método
│   │   └── Método
│   └── Classe
└── Outro módulo

---

# O que é indentação?

Indentação é a forma utilizada para representar visualmente a hierarquia.

Na maioria das linguagens ela é feita utilizando espaços ou tabulações.

---

# Exemplo em YAML

services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: cfit

Hierarquia:

services
└── postgres
    ├── image
    └── environment
        └── POSTGRES_DB

---

# Exemplo em Python

if aluno.ativo:
    print("Aluno ativo")

O print pertence ao bloco if.

---

# Exemplo de estrutura de pastas

CFIT
├── docs
├── src
│   ├── students
│   ├── payments
│   └── dashboard
└── tests

Cada pasta pertence à pasta acima.

---

# Regra

Antes de ler qualquer código, identifique sua árvore hierárquica.

Depois leia cada nível da árvore.