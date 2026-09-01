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

## Execução automática no Windows 11

Para a experiência gráfica, abra `windows\open-app.vbs`. O aplicativo permite salvar a configuração protegida, testar Cfit/iDFace, instalar a inicialização automática e iniciar ou parar a sincronização sem abrir o PowerShell.

Os scripts abaixo permanecem disponíveis para instalação assistida e recuperação:

Copie a pasta `windows` para dentro da pasta local do conector e execute, no PowerShell com o mesmo usuário que operará a integração:

```powershell
.\windows\configure.ps1
.\windows\run-connector.ps1
```

Depois da validação manual, encerre com `Ctrl + C` e instale a tarefa:

```powershell
.\windows\install-task.ps1
```

A tarefa inicia no logon do usuário, permanece ativa com a sessão bloqueada e tenta reiniciar o processo após falhas. `device-key.xml` e `control-id-password.xml` usam DPAPI e só podem ser abertos pelo mesmo usuário no mesmo computador. `connector-config.json` contém somente parâmetros não secretos.

Para remover apenas a inicialização automática, preservando configuração e cursor:

```powershell
.\windows\uninstall-task.ps1
```
