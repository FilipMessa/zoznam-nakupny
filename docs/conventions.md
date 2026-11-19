# Konvencie

Pravidla struktury kodu v `src/`. Prevzate zo surodeneho projektu `galeon` (komponent renderuje, hook drzi stav, service drzi logiku) a doplnene o Firebase vrstvu. Kde sa da, pravidla vynucuje ESLint (`eslint.config.js`), takze `npm run check` zlyha pri poruseni.

## Struktura priecinkov

```
src/
  App.tsx, main.tsx     vstup, stavovy automat prihlasenia (ziadny router)
  screens/              kompozicia viacerych features (ListsScreen)
  features/
    auth/               prihlasenie, clenstvo, invite kod
    lists/              zoznamy (CRUD, prepinac, vyber zoznamu)
    items/              polozky jedneho zoznamu (aktivne, hotove, drag, swipe)
    allLists/           obrazovka "Vsetky zoznamy"
      components/       iba renderujuce komponenty (*.tsx)
      __tests__/        unit testy kodu z tohto priecinka
  components/ui/        genericke UI (Chakra provider, toaster)
  lib/                  firebase.ts, firestorePaths.ts, drobne hooky
  constants/, theme/    konstanty a Chakra tema
  test/                 emulatorove testy a testovacie helpery
```

Smer zavislosti medzi features: `allLists -> lists, items, auth`; `items -> auth`; `lists -> auth`. `lists` a `items` nikdy neimportuju `allLists` (ESLint). `screens/` smie importovat vsetko.

## Vrstvy

```
component (*.tsx)  ->  useX hook  ->  xService.ts  (ciste funkcie)
                                  ->  xApi.ts      (Firestore / Firebase I/O)
```

- **Komponent** iba renderuje a vola callbacky z props / hooku. Ziadna business logika, ziadny pristup k Firebase.
- **`useX` hook** drzi stav a prepaja: vola service funkcie a api funkcie, vracia hodnoty a handlery pre komponent.
- **`xService.ts`** je ciste business logika: validacia, sort, vypocet `activeOrder`, tvorba patchov, texty chyb. Bez Reactu a bez Firebase runtime importov (`import type` z `firebase/*` je v poriadku). Testuje sa bez emulatora.
- **`xApi.ts`** je jediné miesto, kde sa vola Firestore/Auth (`getDoc`, `onSnapshot`, `writeBatch`, `signInWithPopup`, ...). Kazda funkcia prijima volitelny posledny parameter `firestore: Firestore = db`, aby ju testy mohli spustit proti emulatoru. Realtime odbery su `subscribeX(..., onNext, firestore?)` a vracaju `Unsubscribe`.
- **Cesty ku kolekciam** su len v `src/lib/firestorePaths.ts`.

Vynutene ESLintom (`@typescript-eslint/no-restricted-imports`, `allowTypeImports` kde ma zmysel):

| Subory | Nesmu importovat |
| --- | --- |
| `**/*.tsx`, `**/components/**` (okrem `__tests__`, `src/test`) | `firebase`, `firebase/*` (okrem typov), `@/lib/firebase`, `**/*Api` |
| `**/*Service.ts` | `react`, `react-dom`, `firebase/*` (okrem typov), `@/lib/firebase`, `**/*Api` |
| `src/features/lists/**`, `src/features/items/**` | `@/features/allLists/**` |

## Pomenovanie

| Co | Vzor | Priklad |
| --- | --- | --- |
| Komponent | `PascalCase.tsx` v `components/` | `AddItemForm.tsx` |
| Hook | `useX.ts` | `useItemActions.ts` |
| Ciste funkcie | `xService.ts` | `itemService.ts` |
| Firebase I/O | `xApi.ts` | `itemApi.ts` |
| Realtime odber | `subscribeX` v `xApi.ts` | `subscribeItems` |
| Typy domeny | `types.ts` v features | `items/types.ts` |
| Unit test | `__tests__/<nazov>.test.ts(x)` | `__tests__/itemService.test.ts` |
| Emulatorovy test | `src/test/*.integration.test.ts`, `*.rules.test.ts` | `items.integration.test.ts` |

Logika, ktoru pouziva jedna obrazovka, ide do `<obrazovka>Service.ts` vedla nej (napr. `allLists/allListsService.ts`), nie do samostatnych jednoucelovych suborov.

## Testy

- Unit testy (Vitest, jsdom, bez emulatora) su v `__tests__/` vedla kodu, ktory testuju, s rovnakym zakladom nazvu (`foo.ts` -> `__tests__/foo.test.ts`).
- Emulatorove testy maju koncovku `.integration.test.ts` (Firestore + Auth) alebo `.rules.test.ts` (bezpecnostne pravidla), zostavaju v `src/test/` a bezia cez vlastne konfiguracie (`npm run test:integration`, `npm run test:rules`). Priponu treba dodrzat, inak test nebezi nikde.
- E2E (Playwright) su v `e2e/`.
- Komponenty sa testuju s mockovanymi hookmi alebo `*Api` modulmi, nie s Firebase.

## Importy

- Alias `@/` ukazuje na `src/` (`tsconfig.app.json`, `tsconfig.emulator-tests.json`, `vite.config.ts`, `vitest.*.config.ts`). Importy mimo aktualneho priecinka pisem ako `@/features/items/itemService`, nie `../../items/itemService`.
- Importy v tom istom priecinku zostavaju `./x`.
- Ziadne `index.ts` barrely - importuje sa priamo z konkretneho suboru.

## Commity

Jednoriadkovy predmet s predponou: `feat:`, `fix:`, `refactor:`, `chore:`, `test:`, `docs:`, `ci:`. Pred commitom bezi husky + lint-staged (eslint --fix, prettier); nikdy ho neobchadzaj cez `--no-verify`. Pred pushom prejdi `npm run check`.
