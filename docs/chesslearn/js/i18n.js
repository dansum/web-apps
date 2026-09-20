/* i18n.js — all user-visible text lives here. English is the default. */
(function (global) {
  'use strict';

  var STRINGS = {
    en: {
      'app.title': 'Chess Playground',
      'menu.lead': 'Pick a game!',

      'mode.learn.title': 'Meet the Pieces',
      'mode.learn.desc': 'Tap a piece and see where it can go.',
      'mode.pawnrace.title': 'Pawn Race',
      'mode.pawnrace.desc': 'Run your pawns to the other side.',
      'mode.glutton.title': 'The Glutton',
      'mode.glutton.desc': 'Eat all 8 pawns with one piece.',
      'mode.center.title': 'Battle for the Centre',
      'mode.center.desc': 'Knights and bishops fight for the middle.',
      'mode.knight.title': "Knight's Tour",
      'mode.knight.desc': 'Hop on every square, once each.',
      'mode.safe.title': 'Safe Path',
      'mode.safe.desc': 'Walk to the cheese without being caught.',

      'setup.play': 'Play!',

      'opt.opponent': 'Who is playing?',
      'opt.opponent.two': '2 players',
      'opt.opponent.cpu': 'Against the computer',
      'opt.side': 'Your pieces',
      'opt.side.w': 'White',
      'opt.side.b': 'Black',
      'opt.level': 'How clever is the computer?',
      'opt.level.1': 'Sleepy',
      'opt.level.2': 'Learning',
      'opt.level.3': 'Clever',
      'opt.level.4': 'Champion',
      'opt.board': 'Board',
      'opt.board.8': 'Big 8x8',
      'opt.board.6': 'Mini 6x6',
      'opt.piece': 'Which piece do you want?',
      'opt.fight': 'Do the pawns fight back?',
      'opt.fight.off': 'No, they sleep',
      'opt.fight.on': 'Yes, they march',
      'opt.target': 'Golden squares',
      'opt.target.1': 'One square',
      'opt.target.4': 'All four',
      'opt.tsize': 'Board',
      'opt.tsize.5': '5x5 (easier)',
      'opt.tsize.6': '6x6 (harder)',
      'opt.guards': 'How many guards?',
      'opt.guards.2': '2 guards',
      'opt.guards.3': '3 guards',
      'opt.guards.4': '4 guards',

      'piece.p': 'Pawn',
      'piece.n': 'Knight',
      'piece.b': 'Bishop',
      'piece.r': 'Rook',
      'piece.q': 'Queen',
      'piece.k': 'King',

      'game.hint': 'Hint',
      'game.undo': 'Undo',
      'game.restart': 'Again',
      'game.yourturn': 'Your turn!',
      'game.cputurn': 'The computer is thinking...',
      'game.turn.w': "White's turn",
      'game.turn.b': "Black's turn",
      'game.you': 'You',
      'game.computer': 'Computer',
      'game.white': 'White',
      'game.black': 'Black',
      'game.through': 'Pawns through',
      'game.moves': 'Moves',
      'game.left': 'Pawns left',
      'game.pieces': 'Pieces',
      'game.visited': 'Squares visited',
      'game.lives': 'Lives',
      'game.best': 'Best',
      'game.nohint': 'No hint right now.',
      'game.nomoves': 'No moves — turn passes!',
      'game.claim': 'One more move and the golden square is yours!',
      'game.reveal': 'Show danger',

      'help.learn': 'Tap a piece at the bottom, then tap the board. The green dots show where it may go.',
      'help.pawnrace': 'Pawns walk forward and eat sideways. Get as many as you can to the far end!',
      'help.glutton': 'Eat every pawn. Try to use as few moves as you can!',
      'help.center': 'Stand on a golden square and stay there for one whole move — then you win.',
      'help.knight': 'The knight jumps in an L. Visit every square exactly once.',
      'help.safe': 'Move one step at a time. Never stop on a square a guard attacks!',

      'learn.pick': 'Pick a piece:',
      'learn.tip.p': 'The pawn walks one step forward (two on its first move) and eats sideways-forward.',
      'learn.tip.n': 'The knight jumps in an L: two squares, then one to the side. It can jump over everyone!',
      'learn.tip.b': 'The bishop slides on the diagonals and always stays on its own colour.',
      'learn.tip.r': 'The rook slides straight: up, down, left and right.',
      'learn.tip.q': 'The queen is the strongest: straight AND diagonal, as far as she likes.',
      'learn.tip.k': 'The king is slow — just one step in any direction.',
      'learn.star': 'Bonus: can you reach the star?',
      'learn.gotstar': 'You got the star!',

      'result.win': 'You win!',
      'result.lose': 'The computer wins!',
      'result.draw': "It's a draw!",
      'result.wwin': 'White wins!',
      'result.bwin': 'Black wins!',
      'result.done': 'Well done!',
      'result.caught': 'Caught!',
      'result.stuck': 'Stuck! No more knight jumps.',
      'result.again': 'Play again',
      'result.menu': 'Other games',
      'result.score': 'You: {a} — Computer: {b}',
      'result.score2': 'White: {a} — Black: {b}',
      'result.inmoves': 'You did it in {n} moves!',
      'result.newbest': 'New record!',
      'result.visited': 'You visited {n} of {t} squares.',
      'result.center': 'The golden square is yours!',
      'result.captured': 'You took all their pieces!',

      'lang.other': 'БГ'
    },

    bg: {
      'app.title': 'Шах игрище',
      'menu.lead': 'Избери игра!',

      'mode.learn.title': 'Запознай се с фигурите',
      'mode.learn.desc': 'Пипни фигура и виж къде може да отиде.',
      'mode.pawnrace.title': 'Състезание на пешките',
      'mode.pawnrace.desc': 'Прекарай пешките си до другия край.',
      'mode.glutton.title': 'Лакомник',
      'mode.glutton.desc': 'Изяж всичките 8 пешки с една фигура.',
      'mode.center.title': 'Борба за центъра',
      'mode.center.desc': 'Коне и офицери се бият за средата.',
      'mode.knight.title': 'Обиколка на коня',
      'mode.knight.desc': 'Скочи на всяко поле, но само по веднъж.',
      'mode.safe.title': 'Безопасен път',
      'mode.safe.desc': 'Стигни до сиренето, без да те хванат.',

      'setup.play': 'Играй!',

      'opt.opponent': 'Кой играе?',
      'opt.opponent.two': '2 играчи',
      'opt.opponent.cpu': 'Срещу компютъра',
      'opt.side': 'Твоите фигури',
      'opt.side.w': 'Бели',
      'opt.side.b': 'Черни',
      'opt.level': 'Колко умен да е компютърът?',
      'opt.level.1': 'Сънливко',
      'opt.level.2': 'Начинаещ',
      'opt.level.3': 'Хитрец',
      'opt.level.4': 'Шампион',
      'opt.board': 'Дъска',
      'opt.board.8': 'Голяма 8x8',
      'opt.board.6': 'Мини 6x6',
      'opt.piece': 'Коя фигура искаш?',
      'opt.fight': 'Пешките бият ли се?',
      'opt.fight.off': 'Не, те спят',
      'opt.fight.on': 'Да, вървят напред',
      'opt.target': 'Златни полета',
      'opt.target.1': 'Едно поле',
      'opt.target.4': 'И четирите',
      'opt.tsize': 'Дъска',
      'opt.tsize.5': '5x5 (по-лесно)',
      'opt.tsize.6': '6x6 (по-трудно)',
      'opt.guards': 'Колко пазачи?',
      'opt.guards.2': '2 пазача',
      'opt.guards.3': '3 пазача',
      'opt.guards.4': '4 пазача',

      'piece.p': 'Пешка',
      'piece.n': 'Кон',
      'piece.b': 'Офицер',
      'piece.r': 'Топ',
      'piece.q': 'Дама',
      'piece.k': 'Цар',

      'game.hint': 'Подскажи',
      'game.undo': 'Назад',
      'game.restart': 'Отново',
      'game.yourturn': 'Ти си на ход!',
      'game.cputurn': 'Компютърът мисли...',
      'game.turn.w': 'Ход на белите',
      'game.turn.b': 'Ход на черните',
      'game.you': 'Ти',
      'game.computer': 'Компютър',
      'game.white': 'Бели',
      'game.black': 'Черни',
      'game.through': 'Стигнали пешки',
      'game.moves': 'Ходове',
      'game.left': 'Остават пешки',
      'game.pieces': 'Фигури',
      'game.visited': 'Посетени полета',
      'game.lives': 'Животи',
      'game.best': 'Рекорд',
      'game.nohint': 'Сега няма подсказка.',
      'game.nomoves': 'Няма ходове — редът се подминава!',
      'game.claim': 'Още един ход и златното поле е твое!',
      'game.reveal': 'Покажи опасното',

      'help.learn': 'Пипни фигура долу, после пипни дъската. Зелените точки показват къде може да отиде.',
      'help.pawnrace': 'Пешките вървят напред и ядат по диагонал. Прекарай колкото можеш повече до другия край!',
      'help.glutton': 'Изяж всяка пешка. Опитай с колкото може по-малко ходове!',
      'help.center': 'Стъпи на златно поле и остани там цял един ход — тогава печелиш.',
      'help.knight': 'Конят скача буквата Г. Мини през всяко поле точно по веднъж.',
      'help.safe': 'Движи се по една стъпка. Никога не спирай на поле, което пазач напада!',

      'learn.pick': 'Избери фигура:',
      'learn.tip.p': 'Пешката върви една стъпка напред (две при първия си ход) и яде по диагонал напред.',
      'learn.tip.n': 'Конят скача буквата Г: две полета, после едно настрани. Може да прескача всички!',
      'learn.tip.b': 'Офицерът се плъзга по диагонал и винаги си остава на своя цвят.',
      'learn.tip.r': 'Топът се плъзга право: нагоре, надолу, наляво и надясно.',
      'learn.tip.q': 'Дамата е най-силна: и право, и по диагонал, докъдето си иска.',
      'learn.tip.k': 'Царят е бавен — само по една стъпка във всяка посока.',
      'learn.star': 'Бонус: можеш ли да стигнеш до звездата?',
      'learn.gotstar': 'Хвана звездата!',

      'result.win': 'Ти печелиш!',
      'result.lose': 'Компютърът печели!',
      'result.draw': 'Равен резултат!',
      'result.wwin': 'Белите печелят!',
      'result.bwin': 'Черните печелят!',
      'result.done': 'Браво!',
      'result.caught': 'Хванаха те!',
      'result.stuck': 'Задънена улица! Няма повече скокове.',
      'result.again': 'Още веднъж',
      'result.menu': 'Други игри',
      'result.score': 'Ти: {a} — Компютър: {b}',
      'result.score2': 'Бели: {a} — Черни: {b}',
      'result.inmoves': 'Успя за {n} хода!',
      'result.newbest': 'Нов рекорд!',
      'result.visited': 'Посети {n} от {t} полета.',
      'result.center': 'Златното поле е твое!',
      'result.captured': 'Взе всичките им фигури!',

      'lang.other': 'EN'
    }
  };

  var lang = 'en';
  var listeners = [];

  function t(key, vars) {
    var table = STRINGS[lang] || STRINGS.en;
    var s = table[key];
    if (s === undefined) s = STRINGS.en[key];
    if (s === undefined) return key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, name) {
        return vars[name] !== undefined ? vars[name] : m;
      });
    }
    return s;
  }

  function setLang(next) {
    lang = STRINGS[next] ? next : 'en';
    document.documentElement.lang = lang;
    applyStatic();
    for (var i = 0; i < listeners.length; i++) listeners[i](lang);
  }

  function applyStatic(root) {
    var nodes = (root || document).querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
  }

  global.I18N = {
    t: t,
    setLang: setLang,
    getLang: function () { return lang; },
    applyStatic: applyStatic,
    onChange: function (fn) { listeners.push(fn); }
  };
})(window);
