// „Naujienos“: po atnaujinimo vaikui vieną kartą parodoma, kas naujo.
//
// Kaip pridėti naujienas kitam atnaujinimui:
//   1. NEWS sąrašo PRADŽIOJE pridėk naują įrašą su nauju id (pvz., data '2026-12-20').
//   2. items – trumpi sakiniai vaikui: icon, title, text.
//   3. Padidink VERSION faile sw.js.
// Vaikas pamatys tik naujausią įrašą, ir tik vieną kartą (state.newsSeen = id).

export const NEWS = [
  {
    id: '2026-11-24',
    title: 'Naujienos!',
    items: [
      { icon: '🔢', title: 'Iki 20!', text: 'Dabar gali skaičiuoti ne tik iki 10, bet ir iki 20.' },
      { icon: '🦅', title: 'Sakalas!', text: 'Mintinai yra naujas greitis – Sakalas. Jis duoda tik 7 sekundes!' },
      { icon: '🐾', title: 'Nauji draugai!', text: 'Parduotuvėje gali nusipirkti draugo kiaušinį. Iš jo išsiris kačiukas, šuniukas, drakoniukas ar kitas draugas. Kiekvienas draugas auga atskirai.' },
      { icon: '🌱', title: 'Draugai auga ilgiau!', text: 'Dabar yra 9 augimo etapai. Ar užauginsi Legendą? 👑' },
      { icon: '🏠', title: 'Nauji kambariai!', text: 'Gali nusipirkti miegamąjį, virtuvę, kiemą, pilį ir net kosminę stotį.' },
      { icon: '🛍️', title: 'Daug naujų daiktų!', text: 'Nauji rūbai, baldai ir skanėstai. Kuo didesnis tavo draugas, tuo daugiau daiktų gali pirkti.' },
      { icon: '⭐', title: 'Daugiau žvaigždučių!', text: 'Už sunkesnes ir greitesnes užduotis gausi daugiau ⭐.' },
      { icon: '💎', title: 'Deimantai!', text: 'Juos gausi už labai greitą ir teisingą darbą.' },
      { icon: '🎯', title: 'Dienos užduotis!', text: 'Kasdien – nauja užduotis. Už ją gausi ⭐ ir 💎.' },
      { icon: '👑', title: 'Svajonių daiktai!', text: 'Karūną ar vienaragį gausi tik tada, kai būsi tikra čempionė. Jiems reikės ir 💎.' },
    ],
  },
];

export const LATEST_NEWS = NEWS[0];

// Ar reikia rodyti naujienas. Naujam žaidėjui (dar nėra draugo) – ne: jam viskas nauja.
export function newsToShow(state) {
  if (!LATEST_NEWS || !state || !state.monster) return null;
  return state.newsSeen === LATEST_NEWS.id ? null : LATEST_NEWS;
}

export function markNewsSeen(state) {
  if (LATEST_NEWS) state.newsSeen = LATEST_NEWS.id;
}
