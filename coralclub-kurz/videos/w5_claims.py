"""Wissen 5/5 – Was Magnesium laut EU wirklich kann. Aussagen im exakten Wortlaut VO (EU) 432/2012."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from wissen import *

Q = ['VO (EU) Nr. 432/2012, Liste zugelassener gesundheitsbezogener Angaben (Auswahl, Wortlaut unverändert)',
     'VO (EU) Nr. 1169/2011, Art. 7 Abs. 3: Lebensmitteln keine Eigenschaften zur Vorbeugung, Behandlung oder Heilung von Krankheiten zuschreiben']
FOLIEN = [
    dict(typ='titel', zeilen=['Was Magnesium', 'wirklich kann', 'laut EU'], hl=2, d=60),
    dict(typ='titel', zeilen=['Die EU hat geprüft,', 'was man über', 'Magnesium sagen darf'], hl=2, size=120,
         unter=['Das sind die offiziellen Sätze:'], d=84),
    dict(typ='liste', titel=['Offiziell zugelassen (1/2)'], punkte=[
        'Magnesium trägt zur Verringerung von Müdigkeit und Ermüdung bei.',
        'Magnesium trägt zu einer normalen Muskelfunktion bei.',
        'Magnesium trägt zu einer normalen Funktion des Nervensystems bei.'], step=24, size=50, quelle=0, d=140),
    dict(typ='liste', titel=['Offiziell zugelassen (2/2)'], punkte=[
        'Magnesium trägt zu einem normalen Energiestoffwechsel bei.',
        'Magnesium trägt zum Elektrolytgleichgewicht bei.',
        'Magnesium trägt zur Erhaltung normaler Knochen bei.'], step=24, size=50, quelle=0, d=140),
    dict(typ='titel', zeilen=['„Heilt“, „wirkt gegen“,', '„beseitigt“?', 'Darf in Werbung', 'nicht stehen.'], hl=3, size=120, quelle=1, d=96),
    dict(typ='ende', zeilen=['Mehr versprochen?', 'Skeptisch bleiben.'], hl=1, naechste=None,
         produkt='Oceanmin: 120 mg Magnesium pro Stick', d=135),
]
if __name__ == '__main__': make('w5-claims', 5, FOLIEN, Q)
