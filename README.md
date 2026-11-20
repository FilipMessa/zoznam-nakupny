# Rodinny Nakupny Zoznam

Mobile-first webova appka pre rodinu na spravu spolocnych nakupnych zoznamov. Prihlasenie cez Google, pripojenie k rodine cez invite kod, realtime synchronizacia poloziek medzi vsetkymi clenmi. Postavene na Vite + React + TypeScript, backend je Firebase (Auth, Firestore, Hosting).

Detaily o domenovom modeli a terminologii su v [`CONTEXT.md`](./CONTEXT.md), architektonicke rozhodnutia v [`docs/adr/`](./docs/adr), povodny implementacny plan v [`PLAN.md`](./PLAN.md), konvencie struktury kodu v [`docs/conventions.md`](./docs/conventions.md).

## Predpoklady

- **Node.js** — aktualna LTS verzia (projekt je vyvijany a testovany na Node 22; v repozitari nie je `.nvmrc` ani `engines` pole, takze staci akakolvek relativne cerstva LTS verzia).
- **JDK 21+** — potrebny pre prikazy, ktore spustaju Firebase emulatory (`test:rules`, `test:integration`, `test:e2e`). Bez neho `firebase emulators:exec` zlyha.
- **Firebase CLI** — bud globalne (`npm install -g firebase-tools`), alebo bez instalacie cez `npx firebase <prikaz>` (balik `firebase-tools` je aj v `devDependencies`, takze `npx firebase` funguje hned po `npm install`).

## Nastavenie Firebase projektu

1. V [Firebase Console](https://console.firebase.google.com/) vytvor novy projekt.
2. V sekcii **Authentication** zapni **Google** ako sign-in provider.
3. V sekcii **Firestore Database** vytvor databazu (produkcny alebo test mode podla potreby — bezpecnostne pravidla su definovane v `firestore.rules`).
4. V nastaveniach projektu zaregistruj novu **Web App** a skopiruj si jej konfiguracne hodnoty (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) — budes ich potrebovat v `.env`.
5. Priprav lokalny alias na projekt: `firebase use --add` (alebo priamo uprav `.firebaserc`), aby `firebase deploy` mieril na tvoj realny projekt. `.firebaserc` v repozitari obsahuje iba placeholder `zoznam-nakupny-dev` — je zamerne neuplny a ma sa nahradit tvojim vlastnym project ID.

## Premenne prostredia

Skopiruj `.env.example` do `.env` a vyplň hodnoty z Firebase Console:

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE_EMULATOR=false
```

`VITE_USE_FIREBASE_EMULATOR=true` prepne appku na lokalne Firebase emulatory (Auth + Firestore) — vhodne pre lokalny vyvoj bez dotykania sa produkcnych dat. `false` znamena pripojenie na realny Firebase backend podla ostatnych `VITE_FIREBASE_*` hodnot.

## Seed skript (invite kod)

Invite kod nie je nikde v UI generovany — vytvara sa jednorazovo skriptom:

```bash
npm run seed
```

Skript (`scripts/seed.ts`):

- pripoji sa na Firestore emulator na `127.0.0.1:8080` (pokial nie je nastavena premenna `FIRESTORE_EMULATOR_HOST`, doplni si ju sam) — pred spustenim teda musi byt Firestore emulator zapnuty (`firebase emulators:start` alebo `emulators:exec`),
- inicializuje Firebase Admin SDK s natvrdo zapisanym `projectId: 'zoznam-nakupny-dev'`,
- vygeneruje nahodny invite kod (32 hex znakov),
- zapise/mergne dokument `families/{FAMILY_ID}` a vytvori dokument `invites/{inviteCode}` odkazujuci na tuto rodinu,
- vypise vygenerovany invite kod do konzoly — ten sa potom zada v appke pri onboardingu noveho clena.

Pre pouzitie oproti realnemu (nie emulovanemu) projektu treba `projectId` v skripte zmenit na svoje skutocne project ID a nastavit spravne prihlasovacie udaje pre Admin SDK (napr. `GOOGLE_APPLICATION_CREDENTIALS`).

## Migracia Pamate nakupov (jednorazovo)

Pamat nakupov (`families/{FAMILY_ID}/purchaseMemory`, ADR 0004) sa plni pri kazdom odskrtnuti Polozky. Existujuce kupene Polozky do nej raz prenesie skript:

```bash
npm run migrate:purchase-memory                                        # Firestore emulator (127.0.0.1:8080)
GCLOUD_PROJECT=<project-id> npm run migrate:purchase-memory -- --production   # realny projekt, Admin SDK prihlasovacie udaje (napr. GOOGLE_APPLICATION_CREDENTIALS)
```

Pre kazdy normalizovany nazov nastavi pocet (pocet kupenych dokumentov, aj po Zoznamoch), cas posledneho kupenia (najnovsie `completedAt`) a text (z najnovsieho dokumentu). Hodnoty nastavuje, nepriratava, takze opakovane spustenie da rovnaky vysledok; prepise vsak, co sa medzitym naratalo odskrtnutim. Poradie nasadenia: `firebase deploy --only firestore:rules`, potom skript, potom hosting. Clen so starou verziou PWA (kym neklikne na "Obnovit") odskrtava bez zapisu do Pamate; ak sa to stane, staci skript spustit znova, kym nikto nevycisti Kupene — tie odskrtnutia su este medzi kupenymi Polozkami a zapocitaju sa.

## Testy

- **`npm run test`** — unit testy (Vitest). Nepotrebuju ziadny emulator.
- **`npm run test:rules`** a **`npm run test:integration`** — vyzaduju JDK 21+. Firebase emulatory sa nespustaju manualne — oba prikazy si ich sami zabalia cez `firebase emulators:exec` (spustia potrebne emulatory, pockaju kym su ready, spustia testy, a na konci emulatory ukoncia).
- **`npm run test:e2e`** — Playwright testy. Na rozdiel od predoslych dvoch, tento prikaz **nie je** zabaleny do `emulators:exec` v `package.json` skripte — `playwright.config.ts` si sam spusti dev server (`npm run dev`) ako svoj `webServer`. Firestore/Auth emulatory pre testy vyzadujuce prihlaseneho clena (`e2e/mobile-smoke.spec.ts`) treba mat spustene bokom, inak taky test zlyha. Odporucany sposob spustenia celej e2e sady je obalit ju rovnako cez emulatory:

  ```bash
  firebase emulators:exec --only firestore,auth "npm run test:e2e"
  ```

  Nepodmienene (unauthenticated) testy ako `e2e/smoke.spec.ts` by fungovali aj bez emulatorov, kedze sa vobec nedotykaju Auth/Firestore.

## Vyvoj

```bash
npm run dev
```

Spusti Vite dev server na `http://localhost:5173`.

## Build

```bash
npm run build
```

Spusti typecheck (`tsc -b`) a Vite produkcny build do priecinku `dist/`.

## PWA

Aplikacia je instalovatelna PWA (`vite-plugin-pwa`, konfiguracia vo `vite.config.ts`): web manifest + Workbox service worker, ktory precachuje app shell, takze sa appka otvori aj offline (data drzi Firestore persistent cache). Service worker sa generuje len v produkcnom builde; lokalne sa da vyskusat cez `npm run build && npm run preview`. Nova verzia sa neaktivuje sama: appka ukaze toast „Je dostupna nova verzia“ s tlacidlom „Obnovit“.

Ikony v `public/` (`pwa-*.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`) su generovane z `public/logo.svg` a commitnute; po zmene loga ich pregeneruj cez `npx pwa-assets-generator` (konfiguracia v `pwa-assets.config.ts`).

## Deploy

```bash
npm run build
firebase deploy
```

(prip. `npx firebase deploy`, ak nemas `firebase-tools` nainstalovane globalne)

`firebase.json` ma `hosting.public` nastavene na `dist`, co zodpoveda skutocnemu Vite build outputu (v `vite.config.ts` nie je ziadny custom `build.outDir`).

Predtym, nez `firebase deploy` zafunguje, je potrebne:

1. **`firebase login`** — interaktivne prihlasenie cez tvoj Google ucet. Toto je manualny krok, ktory nevie zabezpecit ziadna automatizacia v tomto repozitari.
2. Mat nastaveny **realny Firebase projekt** namiesto placeholder hodnoty v `.firebaserc` (`zoznam-nakupny-dev`) — bud cez `firebase use <project-id>`, alebo priamou upravou `.firebaserc`. Toto zamerne robi vlastnik projektu, nie automatizovany proces.

`firebase deploy` (bez `--only`) nasadi Hosting (build z `dist/`), Firestore rules (`firestore.rules`) aj Firestore indexy (`firestore.indexes.json`).
