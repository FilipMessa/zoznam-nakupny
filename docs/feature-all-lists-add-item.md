# Spec: Pridať položku z All Lists screenu

Vyplynulo z grilling session o rozšírení `AllListsScreen`. Na rozdiel od
`ShoppingListScreen`, kde `AddItemForm` jednoznačne patrí k jednému `listId`
(pozri `ShoppingListScreen.tsx:100-105`), `AllListsScreen` zobrazuje viacero
zoznamov naraz — treba spôsob, ako určiť cieľový zoznam pre pridávanú
položku.

## Rozhodnutia

1. **Výber cieľa cez header sekcie, nezávisle od expand/collapse.**
   `AllListsSection` header má dve nezávislé tap-zóny:
   - **Chevron ikona** (`ChevronDown`/`ChevronRight`) — toggle-uje
     expand/collapse presne ako dnes (`onToggle` v
     `AllListsSection.tsx:86-102`), bez vplyvu na výber cieľa.
   - **Zvyšok headeru (názov zoznamu)** — nová akcia: označí tento zoznam ako
     aktuálny cieľ pre pridávanie, vizuálne zvýraznený (highlight). Nemení
     expand/collapse stav sám o sebe.

2. **Jeden globálny pripnutý add-input dole na obrazovke** (rovnaký vzor ako
   `AddItemForm` v `ShoppingListScreen.tsx:100-105`), ktorý vždy pridáva do
   aktuálne vybraného (highlighted) zoznamu. Žiadny dropdown/picker v
   inpute — cieľ sa volí len cez header.

3. **Počiatočný stav:** žiadny zoznam nie je predvybraný pri otvorení
   `AllListsScreen`. Add-input je disabled/skrytý, kým používateľ nevyberie
   cieľ kliknutím na niektorý header.

4. **Auto-expand pri výbere:** kliknutie na header collapsed zoznamu ho
   zároveň automaticky rozbalí (jediná výnimka z "nezávislosti" tap-zón —
   výber vždy expanduje, i keď chevron/collapse sám o sebe výber nemení).

5. **Perzistencia výberu:** vybraný cieľ ostáva aktívny aj po úspešnom
   pridaní položky (input sa vyprázdni a zostane pripravený na ďalšiu
   položku do rovnakého zoznamu — hromadné pridávanie).

6. **Manuálne zbalenie vybraného cieľa (cez chevron) výber nezruší** — cieľ
   ostáva highlighted aj keď je vizuálne collapsed; ďalšie pridanie ho znova
   auto-rozbalí (bod 4).

7. **Auto-scroll na pridanú položku:** po každom úspešnom pridaní sa
   obrazovka scrollne tak, aby bola novopridaná položka viditeľná (vkladá sa
   na koniec aktívnych položiek danej sekcie, čo môže byť mimo viewportu pri
   viacerých rozbalených sekciách).

## Otvorené pre implementáciu

Presný vizuálny štýl "highlighted" headeru (farba pozadia/border) a
technický mechanizmus zdieľania vybraného `listId` medzi `AllListsScreen`,
jednotlivými `AllListsSection` inštanciami a globálnym add-inputom
(pravdepodobne nový stav v `useAllListsScreen`, analogicky k existujúcemu
`activeItemsByListId` ref-registru).
