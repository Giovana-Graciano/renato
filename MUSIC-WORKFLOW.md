# Música dos cartões — V6

- Cartões com arquivo de áudio (`file`) salvam o áudio como Data URL dentro do JSON e podem iniciar a música no clique que abre o cartão.
- YouTube e Spotify ficam como embeds dentro da página. O primeiro clique do usuário para abrir o cartão é usado como gesto de interação.
- Existe um mini-controle `NOW PLAYING` para pausar/retomar.
- O criador marca `musicaAutoPlay: true` e `cardConfig.musica.autoPlay: true`.

## Limitação prática
YouTube/Spotify dependem das regras e disponibilidade de reprodução/autoplay do próprio provedor e do navegador. O caminho mais previsível para a experiência "clicou, tocou" é um arquivo de áudio enviado pelo amigo.
