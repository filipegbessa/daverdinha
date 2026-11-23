# Checklist do lançamento da loja online (7/12)

Lista do que a Daverdinha precisa **responder**, **cadastrar** e **providenciar**
para a loja abrir no dia **segunda, 7/12**. A parte técnica está no fim, para
saber o que depende de quê. O mapa completo da loja fica em
`daverdinha-api/docs/estado-da-loja.md`.

## Prazos

| Até | O quê | Por quê |
|---|---|---|
| **sex 28/11** | Respostas dos dois questionários e dos dados do negócio (partes 1 e 2) | Com elas escrevemos os textos finais das políticas e do FAQ |
| **sex 28/11** | Conta do Pagar.me de **produção** aprovada (parte 4) | A aprovação da Stone pode levar dias, e precisamos testar uma compra real antes de abrir |
| **qua 3/12** | Catálogo, entregas, retirada e home cadastrados no admin (parte 3) | Dá tempo de revisar tudo na prévia (`/site`) antes de abrir |
| **qui 4/12** | Compra real de valor baixo, estornada em seguida | Prova que o pagamento de verdade funciona |
| **seg 7/12** | Lançamento | Roteiro no fim |

## 1. O que responder: questionários

Os dois estão nesta pasta. As respostas viram os textos das páginas de
política, que a lei exige claros antes da compra (Decreto 7.962/2013 e CDC).

- [ ] **`questionario-politicas.md`**: entrega, retirada, trocas e devoluções,
      privacidade, parcelas e nota fiscal (37 perguntas, cada uma com uma sugestão de resposta).
- [ ] **`questionario-ingressos.md`**: cancelamento e regras das oficinas e
      eventos (13 perguntas, também com sugestões).

## 2. O que confirmar: dados do negócio

Hoje estão fixos no site. Confirmar ou corrigir cada um:

- [ ] **WhatsApp:** (21) 98650-9259
- [ ] **E-mail de contato:** contato@daverdinha.com.br (precisa existir e ser lido)
- [ ] **Instagram:** @daverdinha_
- [ ] **Endereço do ateliê:** R. Capiberibe, 32, Santo Cristo, Rio de Janeiro, RJ, 20220-030
- [ ] **CNPJ e razão social:** 66.371.530/0001-54, 66.371.530 Alana Viana Moreno
- [ ] **Horário de funcionamento** (hoje não aparece no site). Precisa ser
      igual ao do perfil da empresa no Google Maps.
- [ ] **Nota fiscal:** confirmar com o contador se precisa emitir e como. MEI
      emite para empresa (não para pessoa física), e a venda online conta no
      limite anual do MEI. O site não emite nota.

## 3. O que cadastrar no admin

Tudo em `www.daverdinha.com.br/admin`. Dá para revisar o resultado em
`www.daverdinha.com.br/site` antes de abrir a loja.

### Catálogo

- [ ] **Categorias:** nome e texto de abertura de cada uma.
- [ ] **Produtos:** para cada um,
  - nome, descrição, categoria e fotos (a primeira é a capa);
  - preço, e o preço promocional com validade, se houver;
  - **pronta entrega** com a quantidade em estoque, ou **sob encomenda** com o
    prazo em dias;
  - "Destaque" nos que devem aparecer na home (sem nenhum, a vitrine da home
    some).

### Entrega e retirada

- [ ] **Entregas:** as áreas de entrega, o valor de cada uma (R$ 0,00 é
      grátis) e os bairros de cada área. Bairro fora de todas as áreas não
      recebe entrega.
- [ ] **Configurações da loja → Retirada:** ligada ou não; endereço, horário e
      instruções.
- [ ] **Configurações da loja → Parcelas:** máximo de parcelas sem juros e
      valor mínimo da parcela (hoje até 3x, mínimo R$ 30). Os juros dessas
      parcelas ficam por conta da loja.
- [ ] **Promoções → Frete grátis** (opcional): acima de que valor, e em quais
      áreas.
- [ ] **Promoções → Cupons** (opcional): por exemplo, um cupom de inauguração.

### Home e conteúdo

- [ ] **Site → Destaques:** os slides do topo da home (título, texto, foto de
      1600 × 900, botão com link e, se quiser, botão do WhatsApp com a
      mensagem pronta). Sem nenhum, aparece o slide padrão.
- [ ] **Site → Sobre:** título, texto e foto da seção "Sobre".
- [ ] **Eventos** (se houver ingresso à venda no lançamento): data, local,
      vagas, preço ou gratuito, descrição e foto.

## 4. O que providenciar: contas e acessos

- [ ] **Pagar.me (Stone) de produção:**
  - conta aprovada para vender de verdade, com a conta bancária que recebe
    os pagamentos;
  - **Link de pagamento** habilitado (é o que o site usa) e **cartão e Pix**
    habilitados. Na Loja de teste, o suporte teve que ligar cada um à mão;
    vale pedir já para produção;
  - nos passar a chave secreta `sk_live_…` **por um canal seguro** (nunca no
    WhatsApp aberto nem por e-mail) ou cadastrar com a gente na Vercel.
- [ ] **Google:** acesso ao Search Console e ao Merchant Center com a conta da
      Daverdinha (para o Google mostrar o site e os produtos). Se não tiver,
      criamos juntos.
- [ ] **Meta:** acesso ao Gerenciador de Comércio do Business (para o catálogo
      no Instagram e no WhatsApp). O domínio já está verificado.
- [ ] **Google Maps:** perfil da empresa com o mesmo horário e endereço do site.

## 5. O que fica com a gente (para a Daverdinha saber)

- [ ] Terminar o teste de pagamento na Loja de teste: cartão recusado, Pix,
      cupom, ingresso e estorno. *(Cartão aprovado e webhook já funcionam.)*
- [ ] Escrever os textos finais das políticas e do FAQ com as respostas da
      parte 1.
- [ ] Cadastrar a chave de produção e o webhook de produção; fazer a compra
      real de valor baixo e estornar.
- [ ] Adicionar o DMARC no DNS, para a confirmação do pedido não cair no spam.
- [ ] Conferir o backup do banco (Neon).
- [ ] Revisar a prévia com a Daverdinha.

## Dia 7/12: roteiro do lançamento

1. Ligar **"Site completo"** no Dashboard: `/` vira a home e o Google passa a
   ler o site.
2. Ligar **"Loja do site"** e, se for o caso, **"Venda de ingressos"**.
3. Fazer uma compra de conferência (e estornar).
4. Enviar o sitemap no Google Search Console.
5. Cadastrar o feed de produtos no Merchant Center e no catálogo da Meta.
6. Divulgar.
