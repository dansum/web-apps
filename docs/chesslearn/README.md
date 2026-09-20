# Chess Playground / Шах игрище

Six tiny chess games for children around six years old. Everything runs in the
browser — no server, no build step, no dependencies. Open `index.html` and play,
online or from a USB stick.

**English by default, Bulgarian with one tap** (the `EN / БГ` button, top right).
The choice is remembered on the device.

## The games

| Game | What it teaches |
| --- | --- |
| **Meet the Pieces** | How each piece moves. Tap a piece, the green dots show its moves; chase the star. |
| **Pawn Race** | Pawn rules: one step, the first double step, the diagonal capture, *en passant*. Every pawn that reaches the far end is a point. 2 players on one device or against the computer (4 levels), on an 8×8 or a mini 6×6 board. |
| **The Glutton** | How one piece covers the board. Pick a knight, bishop, rook, queen or king and eat eight pawns in as few moves as possible. Optionally the pawns march back at you. |
| **Battle for the Centre** | Why the middle matters. Two knights and two bishops a side; stand on a golden square and survive one enemy move to win. 2 players or computer. |
| **Knight's Tour** | The knight's L-jump. Visit every square of a 5×5 or 6×6 board exactly once. The hint button uses Warnsdorff's rule. |
| **Safe Path** | Reading the enemy's attacks. Walk the little king to the cheese without ever stopping on a square a guard attacks. |

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
through, most squares visited, wins, stars caught — per setting, so a knight on
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
js/rules.js         move generation (no castling, no check — none of the games need it)
js/ai.js            negamax + difficulty levels
js/board.js         board drawing, sliding pieces, taps
js/app.js           menu, setup screens, game panel
js/modes/*.js       one file per mini game
```

A mode registers itself with `App.registerMode({ id, icon, titleKey, descKey,
helpKey, options, start })`. `options` is rendered as the big-button setup
screen; `start(cfg, ctx)` returns `{ hint, undo, destroy }`.

## Notes for grown-ups

* Moves are made by tapping (tap the piece, then tap a green dot) — easier for
  small hands than dragging, and it works the same with a mouse or a finger.
* There is no losing screen with a red cross anywhere; the worst outcome is a
  friendly "the computer wins" with the score.
* Works offline. Plain `<script>` tags, so opening the file directly from disk
  works too — no local server needed.
