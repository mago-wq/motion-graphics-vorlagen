# CLAUDE.md – Motion-Graphics-Vorlagen

Sammlung von Remotion-Vorlagen für Social-Media-Werbevideos. Jede Vorlage ist ein
eigenständiges Remotion-Projekt in ihrem Ordner, mit eigener `CLAUDE.md`, die die
Regeln und Stolperfallen dieser Vorlage enthält. Vor Arbeit an einer Vorlage deren
`CLAUDE.md` lesen.

Neue Vorlage: als eigenen Ordner neben die bestehenden legen und in der README-Tabelle
eintragen. Wiederkehrende Bausteine (FitText, FontGate, SafeArea, SoundTrack, der
Render-Weg mit korrekter AAC-Synchronität aus `barber-ad/scripts/render.sh`) erst dann in
einen gemeinsamen Ordner auslagern, wenn die zweite Vorlage sie wirklich braucht.

## Vorgaben des Auftraggebers (gelten für alle Vorlagen)

- **Keine Gesichter und keine Körperteile im Bild** – auch keine Hände, die ein Produkt halten.
  Produktfotos nur als Packshot oder Stillleben; Shop-Bilder vorher ansehen, viele zeigen
  Models. Gilt auch für KI-generierte Bilder.
- **Wird ein Gesicht gezeigt, sind die Augen immer abgedeckt** – Zensurbalken oder etwas
  anderes darüber, in jedem Frame (auch beim Ein-/Ausblenden und in Rückblenden). Gesichter
  nur auf ausdrücklichen Wunsch, z. B. die Darstellung einer historischen Person. Beispiel:
  `asmu-edit` (Ibn Battuta, Balken mit seinem Namen in arabischer Schrift über den Augen).
- **Keine unwahren Ich-Aussagen** („meine Routine“), keine erfundenen Erfahrungsberichte.
- **Gesundheitsaussagen nur im Wortlaut der EU-Liste** (VO (EU) 432/2012) mit Pflichthinweisen;
  Werbeaussagen der Shopseiten („reinigt“, „stärkt das Immunsystem“) nicht übernehmen.
- **Fakten auf Bildern prüfen:** Was auf einem Etikett lesbar ist (z. B. „30 Capsules“), muss
  zum gesprochenen/geschriebenen Text passen.

## Arbeitsweise mit dem Auftraggeber (gilt für alle Vorlagen)

1. **Zuerst ein schneller Entwurf in niedrigster sinnvoller Qualität** (z. B. 540×960,
   hohe CRF, ohne teure Nachbearbeitung) – so schnell wie möglich hochladen, damit früh
   Feedback kommt. Datei klein halten: Uploads ab ~50 MB kommen im Chat nicht an (~29 MB
   gehen; 1080p × 69 s per 2-Pass mit ~3,2 Mbit/s Video passt).
2. Rückmeldungen einarbeiten.
3. **Erst danach der eine Endrender** in voller Qualität (z. B. 4K).
Lange Renders nie „auf Verdacht“ in voller Qualität starten.

