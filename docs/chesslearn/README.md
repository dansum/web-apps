# Chess Playground / Шах игрище

Sixteen tiny chess games for children around six years old. Everything runs in the
browser — no server, no build step, no dependencies. Open `index.html` and play,
online or from a USB stick.

**English by default, Bulgarian with one tap** (the `EN / БГ` button, top right).
The choice is remembered on the device.

## The games

Sixteen of them, in three steps on the menu: **Beginner**, **Learning** and
**Getting good**.

### Beginner

| Game | What it teaches |
| --- | --- |
| **Meet the Pieces** | How each piece moves. Tap a piece, the green dots show its moves; chase the star. |
| **Find the Square** | Coordinates. We name a square, the child taps it — as many as possible in sixty seconds. Letters and numbers can be shown or hidden. |
| **The Bishop's Colour** | Why a bishop never leaves its own colour. Of six question marks, tap the ones it could reach. |
| **The Glutton** | How one piece covers the board. Pick a knight, bishop, rook, queen or king and eat eight pawns in as few moves as possible. Optionally the pawns march back. |
| **Pawn Race** | Pawn rules: one step, the first double step, the diagonal capture, *en passant*. Every pawn reaching the far end is a point. Two players or the computer, 8x8 or mini 6x6. |
| **Safe Path** | Reading the enemy's attacks. Walk a king to the cheese without ever stopping on an attacked square. |

### Learning

| Game | What it teaches |
| --- | --- |
| **Knight Taxi** | Planning with the knight. Five rides; a ride is perfect when it uses the fewest possible jumps, which the app works out itself. |
| **Knight's Tour** | The L-jump. Visit every square of a 5x5 or 6x6 board exactly once, with a Warnsdorff hint. |
| **Knight Race** | Two knights race to opposite corners; landing on the other knight wins on the spot. Two players or the computer. |
| **Is it Check?** | Recognising an attack on the king. Ten yes/no positions, with the attacker shown after each answer. |
| **Rescue!** | The first safety lesson. One of your pieces is attacked: move it, block the line, or eat the attacker. |
| **Battle for the Centre** | Why the middle matters. Two knights and two bishops a side; hold a golden centre square for one full enemy move. |

### Getting good

| Game | What it teaches |
| --- | --- |
| **Fork!** | The first tactic. Find the one safe square from which the knight attacks two pieces at once. |
| **Mate in One** | What mate actually is. Eight puzzles a game, one from each material set — the lone queen, queen and rook, the two-rook ladder, the lone rook, rook and knight, queen and bishop, the two bishops, and the back rank with the king boxed in by its own pawns. Positions are made at random and kept only when exactly one move mates; the hint shows the piece first and the square on a second press. |
| **Queens Without a Quarrel** | Lines and diagonals. Place 4, 5 or 6 queens so that none attacks another; the hint extends what is already on the board. |
| **Rook and King** | The first endgame. Mate a lonely king with king and rook inside forty moves; the hint plays a three-ply search. |

The `a1` button in the top bar shows or hides the coordinates around the board.

## The menu filter

The **Show** switch at the top of the menu narrows the list to the games two
children can play on one device — Pawn Race, Knight Race and Battle for the
Centre. A game counts as one for two because it offers the "2 players" choice,
so a new game with that option joins the filter by itself. While the filter is
on, opening one of those games starts it set to two players. The filter is not
remembered: every visit opens on all games.

## Two sets of pieces

The **Pieces** switch on the menu swaps the classic chess set for modern
soldiers, with the names changing along with the shapes:

| Chess | Soldiers |
| --- | --- |
| Pawn | Infantryman |
| Knight | Tank |
| Bishop | Humvee |
| Rook | Artillery |
| Queen | Rocket |
| King | President |

Both sets are inline SVG in the same 100x100 box, so nothing else changes: the
rules, the records and every game stay exactly the same. The choice is
remembered on the device. The names follow the set wherever the app names a
piece — the picker in Meet the Pieces, its tips, and the piece choice in The
Glutton. The *game* titles stay chess titles.

## How the computer opponent works

`js/ai.js` is a small negamax search with alpha-beta pruning. Each mode supplies
its own evaluation function. The difficulty level is mostly a *blunder
probability* — on the easy levels the computer finds the best move and then
plays something else on purpose, so a beginner can win:

| Level | Search depth | Chance of a deliberate mistake |
| --- | --- | --- |
| Sleepy | 1 | 60% |
| Learning | 2 | 35% |
| Clever | 3 | 15% |
| Champion | 4 | 0% |

## Records

Each game keeps the record where one makes sense — fewest moves, most pawns
through, most squares visited, right answers, puzzles solved, wins, stars
caught — per setting, so a knight on
an easy level and a queen on a hard one have their own entries. The trophy
button in the top bar opens the list.

Records live in this browser's `localStorage` and nowhere else: no server, no
account, nothing leaves the device. Clearing the browser data clears them.
To carry them to another computer, **Save to a file** writes a plain, readable
text file and **Load from a file** merges one back, keeping whichever result is
better:

```
# Chess Playground / Шах игрище — records
# key<TAB>value<TAB>date   (lines starting with # are ignored)
glutton.n	14	2026-09-20	The Glutton / Knight · fewest moves
knight.5	25	2026-09-20	Knight's Tour / 5x5 (easier) · most squares
```

Only the first three columns are read; the fourth is a human-readable comment.
Unknown keys and broken lines are ignored, so an edited or truncated file can
never break the app. A hand-edited number is taken at face value — the file is
the child's own scorecard, not an authority.

## Files

```
index.html          the single page
css/style.css       the whole theme
js/i18n.js          every user-visible string, EN + BG
js/store.js         localStorage (language, sound)
js/scores.js        records: keys, comparison, text export and import
js/sound.js         short WebAudio blips, no audio files
js/pieces.js        the pieces, drawn as inline SVG
js/rules.js         move generation, attacked squares, check, mate, stalemate
                    (no castling — none of the games need it)
js/quiz.js          the panel, the end dialog and the record call that every
                    round-based game shares
js/ai.js            negamax + difficulty levels
js/board.js         board drawing, sliding pieces, taps
js/app.js           menu, setup screens, game panel
js/modes/*.js       one file per mini game
```

A mode registers itself with `App.registerMode({ id, group, order, icon,
titleKey, descKey, helpKey, options, start })`. `group` is one of `beginner`,
`learning`, `advanced` and `order` places the card inside its group. `options` is rendered as the big-button setup
screen; `start(cfg, ctx)` returns `{ hint, undo, destroy }`.

## Notes for grown-ups

* A game with settings opens on its **Play** button, with the settings folded
  away under a **Settings** row that shows the current choices in one line. A
  child can start straight away; a grown-up opens the row to change the level,
  the side or the board. Whether the row is open is remembered until the page
  is reloaded.
* Moves are made by tapping (tap the piece, then tap a green dot) — easier for
  small hands than dragging, and it works the same with a mouse or a finger.
* There is no losing screen with a red cross anywhere; the worst outcome is a
  friendly "the computer wins" with the score.
* Works offline. Plain `<script>` tags, so opening the file directly from disk
  works too — no local server needed.
