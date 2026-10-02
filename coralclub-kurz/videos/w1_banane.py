"""Wissen 1/5 – Bananen-Mythos. Werte pro 100 g gerundet; schwanken je nach Quelle/Sorte."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from wissen import *

Q = ['Nährwerte pro 100 g, gerundet, je nach Sorte und Datenbank schwankend (u. a. USDA FoodData Central)',
     'Schätzwert DGE für Frauen ab 25 J.: 300 mg/Tag (Männer: 350 mg)']
FOLIEN = [
    dict(typ='titel', zeilen=['Banane =', 'Magnesium?', 'Leider nein.'], hl=2, d=60),
    dict(typ='balken', titel=['Magnesium pro 100 g'], werte=[('Kürbiskerne', 420, 'über 400 mg'), ('Zartbitter (70–85 %)', 230, 'ca. 230 mg'),
         ('Haferflocken', 130, 'ca. 130 mg'), ('Banane', 30, 'ca. 30 mg')], hl=3, quelle=0, d=150),
    dict(typ='zahl', zahl=10, fmt='{} Bananen', size=180, zeilen=['bräuchtest du für', '300 mg am Tag'], hl=1, quelle=1, d=105),
    dict(typ='titel', zeilen=['Oder:', 'ca. 75 g', 'Kürbiskerne'], hl=1, size=170, quelle=0, d=75),
    dict(typ='ende', zeilen=['Bessere Quellen', 'als die Banane'], hl=1, naechste='2: Die 2-Liter-Regel',
         produkt='Oder: Oceanmin, 120 mg pro Stick', d=135),
]
if __name__ == '__main__': make('w1-banane', 1, FOLIEN, Q)
