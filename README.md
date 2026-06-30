# Campo Minado — detector de risco

Implementação do clássico Campo Minado (Minesweeper) em **JavaScript puro**, sem frameworks ou dependências externas. Tema visual inspirado em terminais de detecção retrô.

🎮 [Jogar online](#) — *substitua pelo link do GitHub Pages após o deploy*

## Funcionalidades

- Três níveis de dificuldade: fácil (9×9, 10 minas), médio (12×12, 24 minas) e difícil (16×12, 40 minas)
- Primeiro clique sempre seguro (as minas só são posicionadas depois da primeira jogada)
- Revelação em cascata (flood fill) para áreas sem minas adjacentes
- Marcação de bandeiras com o botão direito do mouse
- Cronômetro e contador de minas restantes
- Totalmente navegável por teclado (Tab para mover entre células, Enter/Espaço para revelar, F para marcar)
- Responsivo, com suporte a `prefers-reduced-motion`

## Tecnologias

- HTML5
- CSS3 (variáveis CSS, grid layout)
- JavaScript (ES6+, sem bibliotecas)

## Como rodar localmente

Não há etapa de build. Basta abrir o arquivo `index.html` no navegador, ou rodar um servidor local simples:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Depois acesse `http://localhost:8000`.

## Estrutura do projeto

```
minesweeper/
├── index.html      # estrutura da página
├── style.css        # estilos e tema visual
├── script.js         # lógica do jogo
└── README.md
```

## Lógica do jogo

A lógica principal está em `script.js` e cobre:

- **Geração do tabuleiro**: matriz de células com estado (`mine`, `revealed`, `flagged`, `adjacent`)
- **Posicionamento de minas**: aleatório, mas excluindo a célula clicada e suas vizinhas imediatas, garantindo que o primeiro clique nunca seja uma derrota
- **Contagem de minas adjacentes**: para cada célula segura, conta quantas das 8 vizinhas contêm minas
- **Flood fill**: revelação recursiva de células vazias conectadas
- **Condição de vitória**: todas as células não-minadas reveladas

## Possíveis melhorias futuras

- Salvar recordes (atualmente o estado não persiste entre sessões)
- Modo de dificuldade customizável (tamanho e quantidade de minas definidos pelo usuário)
- Animações de revelação célula a célula
- Suporte a toque duplo em dispositivos móveis para marcar bandeiras

## Licença

Livre para uso e modificação.
# minesweeper
