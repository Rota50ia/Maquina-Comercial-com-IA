# Story Técnica — US-001/US-002/US-003

**Épico:** EP-01 — Captura e CRM  
**Status:** Em implementação inicial  
**Escopo:** webhook do quiz, criação/atualização de contato e tags automáticas.

## User Stories Cobertas

- US-001: Capturar lead por webhook.
- US-002: Atualizar contato existente sem duplicar.
- US-003: Aplicar tags automáticas.

## Critérios De Aceite

- [ ] Payload válido cria contato.
- [ ] Payload com telefone/e-mail existente atualiza contato.
- [ ] Submissão do quiz é registrada.
- [ ] Tags globais e por gargalo são aplicadas.
- [ ] Score comercial inicial é calculado.
- [ ] Rota comercial inicial é definida.
- [ ] Payload inválido retorna erro claro.
- [ ] Webhook pode validar segredo por header.
- [ ] Logs não expõem credenciais.

## Fora Do Escopo

- Dashboard.
- Envio de WhatsApp.
- Integração UAZAPI.
- IA generativa.
- Handoff visual.

