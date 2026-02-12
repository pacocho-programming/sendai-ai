import sqlite3
import json

conn = sqlite3.connect("data.db")
c = conn.cursor()

c.execute("SELECT id, before_json, after_json FROM corrections")
rows = c.fetchall()

for cid, before, after in rows:
    before = json.loads(before)
    after = json.loads(after)

    print(f"\n[Correction #{cid}]")

    for i, (b, a) in enumerate(zip(before, after)):
        changes = []

        if b["class"] != a["class"]:
            changes.append(f"class {b['class']} → {a['class']}")

        if (
            abs(b["x1"] - a["x1"]) > 1 or
            abs(b["y1"] - a["y1"]) > 1
        ):
            changes.append("position changed")

        if changes:
            print(f" - Box {i}: " + ", ".join(changes))
        else:
            print(f" - Box {i}: no change")