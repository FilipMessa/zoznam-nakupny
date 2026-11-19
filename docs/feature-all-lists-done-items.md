# Spec: Hotové položky na All Lists screene

Vyplynulo z grilling session o rozšírení `AllListsScreen`. `AllListsSection`
dnes zobrazuje len aktívne položky (pozri komentár v
`AllListsSection.tsx:36-41`: "done items are out of scope for this screen").
`ShoppingListScreen` má oddelenú Done sekciu per list. Chceme jednu
**kombinovanú** Done sekciu pre celý All Lists screen, naprieč všetkými
zoznamami.

## Rozhodnutia

1. **Zjednotenie poradia hotových položiek naprieč aplikáciou.** `sortItems`
   (`itemLogic.ts:13-18`) dnes radí `done` vzostupne podľa `completedAt`
   (najstaršie hore). Toto sa **mení na zostupné** (najnovšie dokončené
   hore) — zmena sa týka aj existujúceho `ShoppingListScreen`, nielen novej
   kombinovanej sekcie, aby bolo správanie konzistentné v celej appke.

2. **Jedna spoločná "Hotové" sekcia úplne dole** na `AllListsScreen`, pod
   všetkými per-list akordeón sekciami — nie samostatná Done podsekcia v
   rámci každého zoznamu.

3. **Farba zoznamu ako vizuálny identifikátor pôvodu položky.**
   - Nové: každý zoznam má **deterministicky odvodenú farbu z `list.id`**
     (napr. hash → index do fixnej palety) — **žiadne nové pole vo
     Firestore**, žiadny user-facing color picker.
   - Farba sa zobrazí (a) pri každej položke v kombinovanej Hotové sekcii ako
     indikátor pôvodného zoznamu, a (b) aj v hlavičke každej
     `AllListsSection` vedľa názvu zoznamu, aby si používateľ osvojil
     asociáciu farba↔zoznam skôr, než uvidí zmiešané hotové položky.

4. **Globálne tlačidlo "Vyčistiť"** zmaže hotové položky zo **všetkých**
   zoznamov naraz (rozšírenie existujúceho `ClearDoneButton` konceptu, bez
   potvrdzovacieho dialógu — konzistentné s dnešným správaním
   `ClearDoneButton.tsx` a s ADR-0001 hard-delete-bez-trash filozofiou).

5. **Uncheck (odkliknutie späť na aktívne)** vráti položku do jej pôvodného
   zoznamu; ak je ten zoznam práve zbalený, automaticky sa rozbalí a
   obrazovka sa scrollne k nemu — konzistentné so správaním z
   `feature-all-lists-add-item.md`.

## Otvorené pre implementáciu

Presná farebná paleta a hashovacia funkcia pre `list.id → color`; technický
mechanizmus zbierania done-items naprieč všetkými `AllListsSection`
inštanciami do jedného spoločného zoznamu (analogicky k existujúcemu
`registerActiveItems`/`activeItemsByListId` vzoru v `useAllListsScreen.ts`,
len pre `done` namiesto `active`).
