# CLAUDE.md – coralclub-ad

Remotion-Projekt (TypeScript), 15 s, 1080×1920, 30 fps. Affiliate-Video für Coral Club.
Aufbau und Regeln wie `barber-ad` (dort nachlesen): Inhalte nur in `src/config.ts`,
Zeitpunkte nur in `src/timing.ts`, Ton-Drehbuch in `src/audio/cues.ts` liest dieselben
Werte, Sicherheitszone x 80–1000 / y 250–1500, letzte halbe Sekunde still, keine Musik.

## Besonderheiten

- **Rechtliches:** Nahrungsergänzungsmittel, Werbung in Deutschland. Keine Heil- oder
  Wirkversprechen (HCVO 1924/2006), nur sachliche Angaben von der Produktseite.
  Pauschalaussagen über Coral Club vermeiden. Kennzeichnung „Werbung“ muss durchgehend
  sichtbar bleiben (`AdLabel`). Preise haben einen Stand (`preisStand`) und müssen vor
  jedem Posten neu geprüft werden.
- **Keine Übergänge über `TransitionSeries`:** Die Szenen sind einfache `Sequence`s mit
  hartem Schnitt. Der Schnitt liegt unter `StripeWipe`, der genau auf der Szenengrenze
  alles bedeckt (`WIPE` in `timing.ts`). Wer die Wischer-Zeiten ändert, prüft per
  Filmstreifen, dass auf dem Grenz-Frame nichts von der Szene durchscheint.
- **Schrift liegt lokal** (`public/fonts/`, per `FontFace` in `src/fonts.ts`). Nicht auf
  `@remotion/google-fonts` umstellen: im Cloud-Container scheitert das am TLS-Proxy.
- **Produktfotos** sind freigestellte Shopfotos (`scripts/prepare_products.py`). Das
  Freistellen klappt nur bei Motiven mit farbiger Fläche oder dunklen Kanten; silberne
  Beutel oder weiße Sticks laufen aus. Dann ein anderes Galeriefoto wählen.
- Die Ersparnis im Abschluss wird aus den Preisen berechnet. Sind die Prozente nicht
  bei allen drei gleich, erscheint automatisch „bis zu“ davor.
