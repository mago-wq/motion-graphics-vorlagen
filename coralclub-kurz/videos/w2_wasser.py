"""Wissen 2/5 – Die 2-Liter-Regel."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from wissen import *

Q = ['DGE, 10 Regeln für eine gesunde Ernährung: rund 1,5 Liter Wasser oder andere kalorienfreie Getränke pro Tag',
     'DGE; bei Hitze, Sport oder Fieber steigt der Bedarf']
FOLIEN = [
    dict(typ='titel', zeilen=['2 Liter Wasser', 'am Tag?', 'Sagt die DGE', 'so nicht.'], hl=3, d=66),
    dict(typ='zahl', zahl='1,5', fmt='{} Liter', size=260, zeilen=['empfiehlt die DGE', 'über Getränke'], hl=0, quelle=0, d=96),
    dict(typ='liste', titel=['Gut zu wissen'], punkte=['Wasser oder ungesüßter Tee zählen voll mit',
         'Einen Teil liefert zusätzlich das Essen (Obst, Gemüse, Suppen)',
         'Bei Hitze, Sport oder Fieber brauchst du mehr'], step=22, quelle=1, d=150),
    dict(typ='titel', zeilen=['Einfacher Trick:', '2 Flaschen', 'à 750 ml', '= 1,5 Liter'], hl=3, size=150, d=84),
    dict(typ='ende', zeilen=['In eine davon:', '1 Stick Oceanmin'], hl=1, naechste='3: Was heißt NRV?',
         produkt='120 mg Magnesium pro Stick', d=135),
]
if __name__ == '__main__': make('w2-wasser', 2, FOLIEN, Q)
