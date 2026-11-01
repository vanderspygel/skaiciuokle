# Skaičiuoklė su padarėliu 🐣➕

Skaičiavimo žaidimas pirmokei: sudėtis ir atimtis iki 10, ypač skaičiavimas mintinai. Motyvacija – savas padarėlis, kuris auga, rengiasi ir turi savo kambarį.

Programėlė yra **PWA**: įdiegta į iPad'o pradžios ekraną veikia **visiškai be interneto**. Gryni HTML + CSS + JavaScript, be build žingsnio ir be išorinių bibliotekų.

## Failų struktūra

```
index.html               pagrindinis puslapis
manifest.webmanifest     PWA aprašas (pavadinimas, ikonos, spalvos)
sw.js                    service worker (kešavimas, veikimas be interneto)
css/style.css            visi stiliai
js/
  config.js              lygiai, ribos, laiko lygiai, augimo slenksčiai
  math.js                matematikos variklis (be UI priklausomybių)
  rewards.js             žvaigždutės, lygių atrakinimas, pasiekimai, dienų serija
  storage.js             duomenų saugojimas (localStorage, schemaVersion, migracijos)
  monster.js             padarėlio SVG dalys ir drabužiai
  monsterView.js         padarėlis su animacijomis ir reakcijomis
  catalog.js             parduotuvės prekės ir kainos
  ui.js                  pagalbinės funkcijos (konfeti, langeliai)
  handwriting.js         ranka rašytų skaitmenų atpažinimas ($P metodas, be interneto)
  drawpad.js             piešimo lenta pirštui
  app.js                 paleidimas, ekranų perjungimas
  screens/               ekranai: home, create, levels, setup, quiz, results, shop, room, badges, teach
icons/                   ikonos (180, 192, 512 PNG ir SVG)
tests/                   testai (node --test) ir tests/browser/ – tie patys testai naršyklėje
scripts/make_icons.py    PNG ikonų generatorius (Python be papildomų bibliotekų)
```

## Įkėlimas į GitHub Pages

1. GitHub'e sukurk naują repozitoriją, pvz., `skaiciuokle` (gali būti ir privati, jei turi GitHub Pro; kitaip – vieša).
2. Įkelk visus šio aplanko failus į repozitorijos šaknį:
   ```bash
   git init
   git add .
   git commit -m "Skaičiuoklė"
   git branch -M main
   git remote add origin https://github.com/TAVO-VARDAS/skaiciuokle.git
   git push -u origin main
   ```
   (Arba GitHub svetainėje: **Add file → Upload files** ir nutempk visus failus bei aplankus.)
3. Repozitorijoje: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, šaka `main`, aplankas `/ (root)` → **Save**.
4. Po minutės kitos svetainė bus adresu `https://TAVO-VARDAS.github.io/skaiciuokle/`.

## Pridėjimas į iPad pradžios ekraną

1. iPad'e atidaryk adresą **Safari** naršyklėje (ne Chrome – tik Safari moka įdiegti PWA į iPad).
2. Palauk, kol puslapis pilnai užsikraus (pamatysi padarėlio kūrimo ekraną), ir **palauk dar ~5 sekundes** – tuo metu visi failai išsaugomi offline naudojimui.
3. Bakstelėk **Bendrinti** mygtuką (kvadratas su rodykle aukštyn) → **Įtraukti į pradžios ekraną** („Add to Home Screen“) → **Įtraukti**.
4. Pradžios ekrane atsiras ikona „Skaičiuoklė“. Žaisk **tik per šią ikoną** – Safari skirtuke ir ikonoje duomenys (žvaigždutės, padarėlis) saugomi atskirai.

## Kaip patikrinti, ar veikia be interneto

1. Atidaryk programėlę per pradžios ekrano ikoną, kai internetas **yra** (kad viskas būtų atsisiųsta).
2. Uždaryk ją (perbrauk aukštyn programų perjungiklyje).
3. Įjunk **lėktuvo režimą** (ir išjunk Wi-Fi, jei jis liko įjungtas).
4. Vėl atidaryk per ikoną. Turi atsidaryti pagrindinis ekranas su padarėliu, veikti visi režimai, parduotuvė ir kambarys.

Kompiuteryje tą patį galima patikrinti Chrome: DevTools → Application → Service Workers (turi būti „activated“), Network → „Offline“ → perkrauti puslapį.

## Kaip atnaujinti

1. Pakeisk failus.
2. **Būtinai** `sw.js` faile padidink versiją: `const VERSION = 'v1';` → `'v2'`. Jei pridėjai naują failą – įrašyk jį į `ASSETS` sąrašą.
3. Įkelk į GitHub (`git commit` + `git push`).
4. iPad'e atidaryk programėlę, kai yra internetas. Naujoji versija atsisiunčia fone ir po kelių sekundžių programa persikrauna pati (bet ne užduoties viduryje – tada tik grįžus į kitą ekraną). Jei neatsinaujina – visiškai uždaryk programėlę (perbrauk aukštyn programų perjungiklyje) ir vėl atidaryk.

Vaiko duomenys (žvaigždutės, padarėlis, pasiekimai) atnaujinant **neprarandami**: jie laikomi `localStorage` su `schemaVersion`. Jei keisi duomenų struktūrą – padidink `SCHEMA_VERSION` faile `js/storage.js` ir pridėk migraciją į `MIGRATIONS`.

> ⚠️ Duomenys dingtų, jei ištrintum ikoną iš pradžios ekrano arba išvalytum Safari svetainių duomenis.

## Kaip pradėti iš naujo

**Ženkliukai** ekrano viršuje dešinėje (šalia žvaigždučių) – mygtukas **🔄 Iš naujo**. Jis apsaugotas tėvų užduotimi (sudėtis arba atimtis su dviženkliais skaičiais iki 100; suklydus duodama kita užduotis), o paskui dar kartą paklausiama „Ar tikrai?“. Ištrinama viskas: padarėlis, žvaigždutės, ženkliukai, lygiai, kambarys, kontrolinių istorija ir išmokta rašysena.

## Testai

```bash
node --test
```

Testuojamas `js/handwriting.js` (skaitmenų atpažinimas, „10“ skaidymas, mokymasis iš vaiko pavyzdžių), `js/math.js` (ribos, užduočių tipai, atsakymų variantai, adaptyvumas, pakartojimas po 2–4 užduočių, jokio kartojimo iš eilės) ir `js/rewards.js` (žvaigždutės, augimas, lygių atrakinimas, dienų serija, pasiekimai, migracija).

Jei Node.js neįdiegtas, tuos pačius testus galima paleisti naršyklėje: paleisk vietinį serverį (pvz., `python -m http.server`) ir atidaryk `http://localhost:8000/tests/browser/`.

Ikonas iš naujo sugeneruoti: `python scripts/make_icons.py`.

## Kaip pakeisti ribas (pvz., iki 20)

Faile `js/config.js`: `LIMITS = { maxNumber: 20, maxResult: 20 }`. Lygiai gali turėti ir savo `limits`. Skaičių mygtukai susikuria automatiškai pagal ribą.

## Sprendimai

Smulkūs sprendimai, priimti kuriant:

- **Lygių atrakinimas:** kitas lygis atsidaro, kai lygyje surinkta 15 teisingų atsakymų (iš pirmo karto), o paskutinių 20 atsakymų tikslumas ≥ 80 %. Visi atrakinti lygiai lieka prieinami.
- **Įvedimas:** visi skaičių mygtukai 0–10 ir „Tikrinti“ (atsakymo neatspėsi iš kelių variantų). Mintinai ir kontroliniame galima pasirinkti **🔢 Mygtukai** arba **✍️ Rašyti ranka** (pasirinkimas įsimenamas). Jei rašysena dar neišmokyta – pirmiausia trumpas mokymas, paskui iškart pradedama. Palyginimas visada – du mygtukai su reiškiniais.
- **Laiko lygiai:** 🐢 Vėžlys 40 s, 🐇 Kiškis 30 s, 🦊 Lapė 20 s, 🐎 Žirgas 15 s, 🐆 Gepardas 10 s vienam veiksmui (keičiama `js/config.js`). Žirgas įterptas kaip tarpinis žingsnis tarp Lapės ir Gepardo. Rašant ranka laikas tas pats.
- **Rašymo režimas (✍️ Rašyti):** atsakymas rašomas pirštu. Atpažinimas – „$P“ taškų debesų metodas (piešinys → 32 taškai, lyginama su pavyzdžiais), veikia be interneto ir be didelių modelių. Prieš pirmą kartą vaikas „išmoko padarėlį“ – po kartą parašo 0–9; jos pavyzdžiai sveriami šiek tiek labiau nei numatytieji. Kiekvienas teisingai perskaitytas teisingas atsakymas tampa nauju pavyzdžiu (iki 6 kiekvienam skaitmeniui, seni keičiami naujais), tad atpažinimas gerėja žaidžiant.
- **Rašymas – patvirtinimas:** perskaitytas skaičius rodomas „?“ langelyje, ir tik paspaudus „Tikrinti“ jis tikrinamas. Jei programa perskaitė neteisingai, vaikas tiesiog spaudžia „Trinti“ – tai neskaičiuojama kaip klaida. Neaiškus piešinys → „Nesupratau 🤔“. „10“ rašomas kaip du skaitmenys greta (brūkšniai grupuojami pagal padėtį). Rašyme palyginimų nėra; už teisingą atsakymą 2 ⭐, laiko nėra.
- **Raundas:** įprastas skaičiavimas ir mintinai vyksta raundais po 10 užduočių, kad būtų aiški pabaiga ir pagyrimas.
- **Adaptyvumas:** svoris = bazė × (0,4 + 4 × klaidų dalis) × lėtumas (vidutinis laikas / 6 s, ribose 0,5–3). Nematytos užduotys gauna šiek tiek didesnį svorį, paskutinės 4 – mažesnį. Lengvos užduotys su 0 rodomos rečiau. Užduočių tipas pirmiausia parenkamas pagal tipo vidutinį svorį, tada konkreti užduotis.
- **Statistika:** fiksuojamas tik pirmas atsakymas į užduotį. Visi palyginimai kaupiami po vienu raktu `cmp` (jų derinių per daug, jie generuojami atsitiktinai).
- **Žvaigždutės:** įprastame režime ⭐ duodama už teisingą atsakymą ir iš antro bandymo (vaikui maloniau), bet serija ir lygio progresas skaičiuojami tik už atsakymus iš pirmo karto. Greitas atsakymas mintinai – teisingas iš pirmo karto per pusę laiko.
- **Mintinai, klaida:** pirmą kartą suklydus – „Beveik!“, laikas eina toliau; antrą kartą – parodomas atsakymas. Pasibaigus laikui – „Laikas baigėsi – pabandom dar kartą?“, antrą kartą – parodomas atsakymas.
- **Laikmatis:** padarėlis eina takeliu iki namelio 🏡. Jokių skaičių, raudonos spalvos ar mirksėjimo.
- **Kontrolinis:** neatsakius per laiką užduotis laikoma klaidinga (klaidų sąraše rodoma ⏰). Premija = įvertinimo ⭐ × užduočių skaičius / 2 (3 ⭐ su 20 užduočių = 30 ⭐). Už atskirus atsakymus kontroliniame žvaigždučių nėra – tik premija. „Klaidų medžiotojas“ – kai pakartojimo raunde visos klaidos pataisytos (ne vėliau kaip iš antro bandymo).
- **Augimas:** 🥚 0 ⭐ → mažylis 15 ⭐ (išsirita jau per pirmą žaidimą) → paauglys 250 ⭐ → didelis 700 ⭐. Žaidžiant ~15 min. per dieną (~40–50 ⭐) paskutinis etapas pasiekiamas per ~2–3 savaites. Skaičiuojamos visos kada nors uždirbtos žvaigždutės.
- **Dienų serija:** jei praleidžiama diena, serija prasideda iš naujo, bet padarėlis niekada neliūdi – grįžus jis sako „Valio, tu grįžai!“.
- **Baldai ir skanėstai** piešiami sisteminiais emoji (iPad'e jie gražūs ir veikia be interneto), kilimai, tapetai ir grindys – CSS. Padarėlis ir drabužiai – originalūs SVG.
- **Kūrimo ekrane** padarėlis rodomas užaugęs („toks išsiris“), o pradžioje jis yra kiaušinis jo spalvos dėmėmis. Parduotuvėje drabužių peržiūra visada rodo užaugusį padarėlį.
- **Pirkiniai:** nupirkti drabužiai ir kūno dalys iš karto užsidedami; baldai atsiranda kambaryje atsitiktinėje vietoje. Kiekvieną baldą galima turėti vieną. Skanėstai „suvalgomi“ iš karto (animacija), jų galima pirkti kiek nori.
- **Padarėlio išvaizdą** galima keisti bet kada (✏️ pagrindiniame ekrane), ten pat skiltis „Rūbai“. Marškinėliai, suknelė ir kombinezonas nemokami (galima aprengti jau kuriant), kiti drabužiai, apsiaustas ir sparnai perkami parduotuvėje. Drabužiai apkerpami pagal kūno formą, todėl tinka visiems kūnams; vienu metu – po vieną daiktą kiekvienoje vietoje (drabužis, nugara, kepurė, akiniai, kaklas).
- **Šriftas:** sisteminis apvalus (`ui-rounded` – iPad'e SF Pro Rounded) su visomis lietuviškomis raidėmis.
- **Priartinimas:** išjungtas dvigubas bakstelėjimas (`touch-action: manipulation`) ir gestų priartinimas, teksto žymėjimas išjungtas visur, išskyrus vardo laukelį.
