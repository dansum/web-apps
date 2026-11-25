// The painted styles of the 20 Serdika St walk. The page picks one with <html data-style="…">.
// Everything that differs between the styles is described here; the code reads STYLE.

const VANGOGH = {
  id: 'vangogh',
  // crooked world: how far walls lean (per metre of height) and how much they ripple
  wobble: { lean: 0.028, ripple: 0.14 },
  // the plaster colours of Arles: the Yellow House, pale blues and pinks, lilac shadows
  plaster: ['#f2cf6a', '#f0d890', '#e9b85a', '#f3e2b0', '#d9a35c', '#c9d9c0', '#a9c4dc', '#e8c0a0', '#f4dca0', '#e3c9e0', '#f6e6b8', '#b8d0e8', '#f0c890', '#d8e4b0', '#f2b880', '#e0d0f0'],
  trees: {
    summer: ['#3f8a4a', '#5fa040', '#7ab83f', '#2f7a5a', '#4f9a3a', '#9cc040', '#3a7a6a'],
    autumn: ['#f2b52e', '#e8862a', '#d0582a', '#f2cf4a', '#b8a030', '#c9702a', '#7a9a3a'],
    winter: ['#7a5a7a', '#6a5a8a', '#8a6a5a', '#5a5a7a'],
    cypress: ['#1f5a4a', '#2a6a4a', '#1f4a5a', '#2f6a3a'],
  },
  cypressShare: 0.17,
  font: '"Caveat", "Marck Script", cursive', fontScale: 1.25, fontWeight: 700,
  sky: 'swirl',
  light: { sun: 1, hemi: 1 },
  // oil-paint filter
  sunflowers: true,
  post: { strokes: 1, brush: 1.6, posterize: 0, edge: 0.8, edgeLo: 0.035, edgeHi: 0.12, broken: 1, edgeColor: '#1a2660', sat: 1.4, shadow: [0.72, 0.84, 1.3], shadowAmt: 0.35, warm: [1.12, 1.05, 0.82], weave: 1, relief: 1 },
  text: {
    bg: {
      kicker: 'Разходка в 3D · по Ван Гог',
      lede: 'Същите улици в радиус 200 метра около ул. „Сердика“ №20, но нарисувани с маслени бои, както би ги нарисувал Винсент ван Гог: накривени стени, вихрено небе, мазки по всичко, кипариси и кафенета с жълти тенти. Сградите, улиците и надписите са от реалните данни на OpenStreetMap. Плъзни часа към вечерта за звездна нощ.',
      title: 'ул. „Сердика“ 20 · по Ван Гог',
    },
    en: {
      kicker: '3D walk · after Van Gogh',
      lede: 'The same streets within 200 metres of 20 Serdika Street, painted in oils the way Vincent van Gogh might have painted them: leaning walls, a swirling sky, brush strokes on everything, cypresses and cafés with yellow awnings. Buildings, streets and signs come from real OpenStreetMap data. Slide the time towards evening for a starry night.',
      title: '20 Serdika St · after Van Gogh',
    },
  },
};

const MAISTORA = {
  id: 'maistora',
  // naive, hand-built houses: a slight lean only
  wobble: { lean: 0.009, ripple: 0.05 },
  // pure, bright colours of Vladimir Dimitrov – the Master: ochre, vermilion, emerald, turquoise, rose
  plaster: ['#f4c542', '#f2a03a', '#e8664a', '#f6e2a8', '#5fbf8f', '#4fb0c6', '#f08aa0', '#f7d36a', '#e3b04a', '#a6d46a', '#f5b97a', '#7fc6d8', '#f3d9b0', '#e98c5a'],
  trees: {
    // leaves and apples are painted into the texture; the tint only varies them a little
    summer: ['#ffffff', '#f2fff0', '#fffbe8', '#eef8ff'],
    autumn: ['#ffffff', '#fff4e0', '#fffbe8', '#ffeede'],
    winter: ['#ffffff', '#f4f4ff', '#fff8f4'],
    cypress: ['#ffffff'],
  },
  cypressShare: 0,
  leavesBySeason: true,
  font: '"Yeseva One", "Marck Script", serif', fontScale: 1.0, fontWeight: 400,
  sky: 'folk',
  // flat, even light: tempera has hardly any modelling
  light: { sun: 0.35, hemi: 1.7 },
  // flat colour fields with firm dark contours, like tempera on board
  post: { strokes: 0, brush: 1.0, posterize: 7, edge: 0.9, edgeLo: 0.025, edgeHi: 0.08, broken: 0, edgeColor: '#2a1712', sat: 1.45, shadow: [0.95, 0.85, 1.05], shadowAmt: 0.2, warm: [1.08, 1.04, 0.9], weave: 0.5, relief: 0.3 },
  text: {
    bg: {
      kicker: 'Разходка в 3D · по Майстора',
      lede: 'Същите улици в радиус 200 метра около ул. „Сердика“ №20, нарисувани в духа на Владимир Димитров – Майстора: чисти ярки цветове, плътни тъмни контури, шевици по фасадите, ябълки по дърветата и цветя в тревата. Сградите, улиците и надписите са от реалните данни на OpenStreetMap. Вечер небето се обсипва с осмолъчни звезди.',
      title: 'ул. „Сердика“ 20 · по Майстора',
    },
    en: {
      kicker: '3D walk · after the Master',
      lede: 'The same streets within 200 metres of 20 Serdika Street, painted in the spirit of Vladimir Dimitrov – the Master: pure bright colours, firm dark outlines, folk embroidery on the facades, apples on the trees and flowers in the grass. Buildings, streets and signs come from real OpenStreetMap data. In the evening the sky fills with eight-pointed stars.',
      title: '20 Serdika St · after the Master',
    },
  },
};

export const STYLES = { vangogh: VANGOGH, maistora: MAISTORA };
export const STYLE = STYLES[document.documentElement.dataset.style] || VANGOGH;
