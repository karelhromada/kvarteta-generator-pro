# Plán projektu: Unifikovaný Generátor Karetních her (Mřížkový Editor)
**GitHub Repo:** https://github.com/karelhromada/kvarteta-generator-pro.git

Tento nástroj slouží k profesionální tvorbě a vizuálnímu ladění celých karetních sad (Hrací karty, Kvarteta, Pexesa) v rámci jednoho přehledného rozhraní.

## Hlavní Vize: "Vše na stole"
Namísto odděleného ořezávání a následného skládání pracuje uživatel přímo v **Mřížce karet** (32 u Pokeru/Kvartet, 16+ u Pexesa). 

### 1. Interaktivní Mřížka (Workspace)
*   **Prázdná Sada**: Při startu se vygeneruje prázdná mřížka karet s popisky (např. "Sedmička Srdcová" nebo "1A").
*   **Individuální Import (Drag & Drop)**: Uživatel přetáhne obrázek přímo na konkrétní kartu v mřížce. Karta se okamžitě stane aktivním "ořezávačem".
*   **Lokální Manipulace**: Na každé kartě lze nezávisle posouvat, zoomovat a deformovat obrázek (Pan & Zoom) tak, aby dokonale ladil s jejím účelem.

### 2. Globální Kontroly (Levý Panel)
*   **Nastavení Karty**: Společná šířka, výška a zaoblení pro celou sadu.
*   **Režimy Sady**:
    *   **Hrací karty (32 ks)**: 4 řádky (barvy) po 8 kartách (7-Eso).
    *   **Kvarteta (32 ks)**: 8 řádků po 4 kartách (A-D).
    *   **Pexeso (variabilní)**: Výchozích 16 čtvercových karet, možnost měnit počet (8, 16, 32).
*   **Globální Vrstva (Overlay)**: Možnost nahrát druhý obrázek/ikonu (např. logo nebo společný rám), který se vykreslí nad VŠEMI kartami současně.

### 3. Workflow
1.  **Výběr typu hry** (vygeneruje se mřížka).
2.  **Nastavení rozměrů** (celá mřížka se sjednotí).
3.  **Drag & Drop obrázků** na jednotlivé pozice a jejich vizuální doladění.
4.  **Uložení projektu** do JSONu pro pozdější návrat.
5.  **Hromadný Export** kapiček k tisku.

---

## Technická Architektura

**Stav (AppState):**
*   `gameMode`: `playing_cards` | `quartet` | `pexeso`
*   `globalSettings`: Rozměry, Rámečky, Globální Overlay.
*   `cards`: Pole objektů. Každý objekt nese své `image` a `crop` souřadnice.

**Logika:**
*   Delegované události myši: Editor pozná, na kterou kartu uživatel klikl a kterou zrovna "přetahuje".
*   Renderování: Mřížka je optimalizovaná, aby plynule zobrazovala i 32 velkých obrázků s CSS transformacemi.

