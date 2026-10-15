# Memoria do projeto Cavalheiro Camisaria

## Referencias

- Aplicacao publicada: https://pixel-perfect-palette-2833.lovable.app
- Repositorio GitHub: https://github.com/cavalheirodirecao-del/pixel-perfect-palette-2833
- Projeto Lovable: https://lovable.dev/projects/ad726648-0051-4020-8511-64c2c0d2521a
- Site de referencia de layout: https://www.hopp.bio/cavalheirocaruaru
- Site de referencia do fluxo por localidade: https://whts.co/reserva

## Objetivo funcional

Criar uma pagina publica para a Cavalheiro Camisaria em que o cliente escolhe a cidade/unidade e recebe apenas um contato de vendedor. A distribuicao deve ser justa, usando rodizio controlado no backend. Os demais vendedores nunca devem ser exibidos publicamente.

Unidades planejadas:

- Caruaru
- Toritama
- Santa Cruz Moda Center
- Santa Cruz Centro
- Palmares
- Maceio

## Decisoes de produto

- O primeiro passo publico e escolher a cidade/unidade.
- Santa Cruz Moda Center e Santa Cruz Centro sao unidades distintas.
- Depois da escolha, mostrar um unico botao para WhatsApp.
- O encaminhamento seleciona o vendedor no backend e registra o evento.
- Se houver somente um vendedor ativo, usar esse vendedor.
- Se nao houver vendedor ativo, usar o contato geral da unidade.
- Endereco e link do Google Maps devem aparecer junto da unidade.

## Arquitetura atual observada

- Frontend React/Vite com TanStack Router.
- Supabase para dados, autenticacao e RLS.
- Drizzle/migrations no diretorio `drizzle`.
- Paginas publicas: `src/routes/index.tsx` e `src/routes/$slug.tsx`.
- Redirecionamento de vendedor: `src/routes/redirect.$loja.$tipo.ts`.
- Painel administrativo: `src/routes/_authenticated/admin.tsx`.
- Funcao de rodizio: SQL `pick_seller`, com bloqueio da linha da loja para garantir selecao atomica.
- CRUD administrativo protegido por `has_role` e RLS.

## Regra tecnica essencial

O rodizio deve permanecer exclusivamente na funcao SQL `pick_seller`, chamada pela rota `/redirect/$loja/$tipo`. Nao mover a selecao para `localStorage`, frontend ou dados publicos, pois isso permite repeticao, concorrencia incorreta ou exposicao dos vendedores.

## Dados ainda necessarios

- Endereco completo e link do Maps de cada unidade.
- Horario de atendimento de cada unidade.
- Numero geral de fallback.
- Nome, WhatsApp e links de atendimento de cada vendedor.
- Imagens finais de capa e logo.

## Observacao sobre REA

A analise REA nao foi executada nesta sessao porque o conector MCP do REA nao estava disponivel. As referencias de comportamento foram observadas diretamente nos sites publicos indicados.
