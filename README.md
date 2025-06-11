
# Go-To-Go Task!

**Go-To-Go Task!** is een moderne, cross-platform to‑do app gebouwd met React Native en Expo. Met deze app kun je:

- **Taken beheren**: aanmaken, bewerken, afvinken en verwijderen
- **Lijsten organiseren**: meerdere lijsten aanmaken en in gewenste volgorde slepen
- **Herinneringen instellen**: datum en tijd voor meldingen per taak
- **Thema wisselen**: handmatig of automatisch tussen light, dark en systemmodus schakelen
- **Meertaligheid**: Nederlands, Engels en Turks met dynamische vlag‑knop
- **Zoeken en filteren**: taken doorzoeken en filteren op status (alles, open, voltooid)

---

## Inhoud van dit project

```
├── app/                  # Expo Router mappen en schermen
│   ├── _layout.tsx       # Globale layout, thema & navigatie
│   ├── index.tsx         # Homescreen: lijsten & navigatie
│   ├── list/[key].tsx    # Lijstdetail: taken per lijst
│   ├── new-list.tsx      # Nieuwe lijst aanmaken
│   └── search.tsx        # Zoekscherm
├── components/           # Herbruikbare UI-componenten
├── context/              # React Contexts voor lists, theme, language
├── hooks/                # Custom hooks (useTasks, useBaseMenu, etc.)
├── locales/              # Vertalingsbestanden (en.json, nl.json, tr.json)
├── utils/                # Hulpfuncties (vertaling, menuDefaults)
└── assets/               # Afbeeldingen, lettertypes
```

---

## Beschikbaarheid

De iOS-versie van **Go-To-Go Task!** is nu live in de App Store. Je kunt de app downloaden via:

[Download Go-To-Go Task! op iOS](https://apps.apple.com/us/app/go-to-go-task/id6746943031)

## Demo

<p align="center">
  <img src="./demo.gif" alt="App Demo" width="400" />
</p>

## Belangrijke onderdelen

- **Navigation**: Expo Router voor file‑based routing
- **State & data**: AsyncStorage voor lokaal opslaan van lijsten en taken
- **Notificaties**: Expo Notifications API voor het plannen en afhandelen van meldingen
- **Theming**: React Context + NativeWind/Tailwind voor light/dark mode
- **i18n**: custom LanguageContext met JSON‑bestanden en vlag‑knop
- **Drag & Drop**: react‑native‑draggable‑flatlist voor herordenen van lijsten en taken
- **Zoeken & filteren**: TextInput en FilterBar‑component

---

## Meertaligheid

- Vertalingen staan in `locales/en.json`, `locales/nl.json`, `locales/tr.json`.
- Met de vlag‑knop rechtsboven wissel je tussen NL 🇳🇱, EN 🇬🇧 en TR 🇹🇷.
- Labels, placeholders en knoppen passen direct mee.

---

## Contributie

Bijdragen zijn welkom!

1. Fork de repository
2. Maak een feature‑branch (`git checkout -b feature/naam`)
3. Commit je wijzigingen (`git commit -m "Beschrijving"`)
4. Push naar je fork (`git push origin feature/naam`)
5. Open een Pull Request

---

## Licentie

MIT License © 2025 [Gokhan Yaka] 