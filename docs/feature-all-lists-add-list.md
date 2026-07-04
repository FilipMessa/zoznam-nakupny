# Spec: Pridať zoznam z All Lists screenu

Vyplynulo z grilling session o rozšírení `AllListsScreen` (akordeónový prehľad
všetkých zoznamov s cross-list drag & drop, pozri `AllListsScreen.tsx`,
`AllListsSection.tsx`, `useAllListsScreen.ts`). Zatiaľ neexistuje spôsob, ako
vytvoriť nový zoznam bez opustenia tejto obrazovky.

## Rozhodnutia

1. **Vstupný bod:** ikona `Plus` v headeri `AllListsScreen`, vedľa tlačidla
   "Späť" (`ArrowLeft`). Nie tlačidlo na spodku zoznamu, nie oba naraz.

2. **Formulár:** znovupoužiť existujúcu `CreateListForm` komponentu
   (`src/features/lists/components/CreateListForm.tsx`) a `useCreateListForm`
   hook — rovnaká validácia, rovnaký offline-first optimistic create
   (`useCreateListForm.ts:39-83`), žiadna nová logika pre názov/validáciu.

3. **Správanie po úspešnom vytvorení — zmena oproti existujúcemu flow:**
   používateľ **zostáva na `AllListsScreen`**, nie je presmerovaný na
   single-list obrazovku. `useCreateListForm`'s `handleCreate` nesmie v tomto
   kontexte volať `selectList(listId)` (ktorý dnes prepína `ListsScreen` preč
   z `allListsOpen` vetvy — pozri `useListsScreen`/`ListsScreen.tsx:64-66`).
   Treba rozlíšiť volanie z `AllListsScreen` od volania z
   `ListSwitcherOverlay`/empty-state, kde presmerovanie zostáva žiadúce.

4. **Novo vytvorený zoznam sa v akordeóne zobrazí rozbalený** (rovnako ako
   všetky ostatné sekcie štartujú expanded — pozri komentár v
   `useAllListsScreen.ts:59-63`), aby naň mohol používateľ hneď nadviazať
   pridávaním položiek (pozri `feature-all-lists-add-item.md`).

## Otvorené pre implementáciu

Presný mechanizmus, ako `handleCreate`/`useCreateListForm` rozlíši
"neselectuj/nenavigovať" variant — či cez nový parameter, alebo cez
samostatný wrapper hook špecifický pre `AllListsScreen`.
