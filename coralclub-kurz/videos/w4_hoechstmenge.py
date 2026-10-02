"""Wissen 4/5 – Viel hilft viel? Höchstmenge in Nahrungsergänzungsmitteln."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from wissen import *

Q = ['BfR, Höchstmengenvorschläge für Nahrungsergänzungsmittel (2021): Magnesium max. 250 mg/Tag, auf mind. 2 Portionen verteilt',
     'BfR / EFSA: Die Grenze betrifft zugesetztes Magnesium, nicht das aus normalen Lebensmitteln']
FOLIEN = [
    dict(typ='titel', zeilen=['Magnesium:', 'Viel hilft viel?', 'Nein.'], hl=2, d=60),
    dict(typ='zahl', zahl=250, fmt='{} mg', size=280, zeilen=['pro Tag aus Nahrungs-', 'ergänzungsmitteln', 'empfiehlt das BfR maximal'], hl=2, quelle=0, d=110),
    dict(typ='liste', titel=['Warum?'], punkte=['Zu viel auf einmal kann abführend wirken',
         'Deshalb rät das BfR: auf mindestens 2 Portionen verteilen',
         'Magnesium aus normalem Essen zählt dabei nicht mit'], step=22, quelle=1, d=150),
    dict(typ='balken', titel=['Pro Tag, nur Präparate'], werte=[('Empfohlene Obergrenze (BfR)', 250, '250 mg'), ('1 Stick Oceanmin', 120, '120 mg')], hl=1, quelle=0, d=110),
    dict(typ='titel', zeilen=['Bei Erkrankungen', 'oder Medikamenten:', 'vorher ärztlich', 'beraten lassen'], hl=2, size=120, d=80),
    dict(typ='ende', zeilen=['Lieber wissen,', 'was man nimmt'], hl=1, naechste='5: Was Magnesium wirklich kann',
         produkt='Oceanmin: 120 mg pro Stick, 1 Stick täglich', d=135),
]
if __name__ == '__main__': make('w4-hoechstmenge', 4, FOLIEN, Q)
