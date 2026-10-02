"""Wissen 3/5 – Was heißt NRV?"""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from wissen import *

Q = ['VO (EU) Nr. 1169/2011, Anhang XIII: Nährstoffbezugswert Magnesium 375 mg',
     'DGE-Schätzwerte für Erwachsene ab 25 Jahren']
FOLIEN = [
    dict(typ='titel', zeilen=['„32 % NRV“', 'Was steht da', 'eigentlich?'], hl=0, d=60),
    dict(typ='titel', zeilen=['NRV =', 'Nährstoff-', 'bezugswert'], hl=0, size=170,
         unter=['Ein EU-weiter Vergleichswert,', 'damit Packungen vergleichbar sind'], d=105),
    dict(typ='zahl', zahl=375, fmt='{} mg', size=280, zeilen=['= 100 % NRV', 'bei Magnesium'], hl=0, quelle=0, d=90),
    dict(typ='titel', zeilen=['120 mg ÷ 375 mg', '= 32 %'], hl=1, size=140, unter=['1 Stick Oceanmin'], d=84),
    dict(typ='liste', titel=['Aber: kein', 'persönlicher Bedarf'], punkte=['DGE-Schätzwert Frauen: 300 mg pro Tag',
         'DGE-Schätzwert Männer: 350 mg pro Tag', 'Den Großteil liefert normales Essen'], step=20, quelle=1, d=140),
    dict(typ='ende', zeilen=['Jetzt kannst du', 'Packungen lesen'], hl=1, naechste='4: Viel hilft viel?',
         produkt='Oceanmin: 120 mg Magnesium pro Stick', d=135),
]
if __name__ == '__main__': make('w3-nrv', 3, FOLIEN, Q)
