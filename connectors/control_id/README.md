# Cfit Connector — Control iD

Agente local para equipamentos da linha de acesso Control iD. Ele busca comandos no Cfit usando somente conexões HTTPS de saída e conversa com a API REST do equipamento na rede local.

## Estado da integração

Implementado:

- autenticação no Cfit por chave individual do dispositivo;
- autenticação e reaproveitamento de sessão na Control iD;
- sincronização inicial de usuário;
- liberação de entrada e saída da catraca;
- coleta sob demanda de registros de acesso;
- sincronização incremental e idempotente de acessos concedidos e negados;
- preservação do horário original do equipamento e cursor local para retomada;
- confirmação de sucesso ou falha de cada comando.

Ainda exige homologação com equipamento real antes de uso operacional. Remoção de usuário, cartões, faces, digitais, regras completas e monitor de eventos serão adicionados após confirmar modelo e firmware.

## Configuração local

Use `.env.example` como referência e configure as variáveis no serviço do sistema operacional. Não salve senhas no repositório.

Instale as dependências e execute:

```bash
python -m pip install -r requirements.txt
python connector.py
```

A chave `CFIT_DEVICE_KEY` é exibida uma única vez ao rotacionar a chave do dispositivo no Cfit.

O arquivo configurado em `CFIT_STATE_FILE` guarda somente o último identificador de log processado. Preserve-o entre reinícios para evitar releitura desnecessária; a API do Cfit também rejeita duplicações pela chave idempotente do evento.
