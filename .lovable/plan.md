## Ziel
Der Recovery-Link öffnet direkt `/reset-password`, zeigt zwei Passwortfelder, speichert das neue Passwort und leitet den Admin anschließend nach `/admin` weiter.

## Umsetzung
1. **Recovery-Weiterleitung robust machen**
   - Recovery-Parameter sowohl aus URL-Hash als auch Query-Parametern erkennen.
   - Links, die auf `/` ankommen, inklusive aller Token-/Code-Parameter verlustfrei nach `/reset-password` weiterleiten.
   - PKCE-Code sowie klassische Recovery-Tokens unterstützen.

2. **Passwortseite korrigieren**
   - Recovery-Session ausdrücklich aus dem Link herstellen und nicht lediglich irgendeine vorhandene Session als gültigen Recovery-Vorgang behandeln.
   - Während der Prüfung einen klaren Ladezustand anzeigen.
   - Bei abgelaufenem/ungültigem Link eine verständliche Fehlermeldung mit Rückweg zu `/admin/login` anzeigen.
   - Nach erfolgreichem `updateUser({ password })` die Session validieren und zu `/admin` navigieren.

3. **Redirect-Konfiguration prüfen/anpassen**
   - `https://geschenk-gl.lovable.app/reset-password` als erlaubtes Recovery-Ziel sicherstellen.
   - Der „Passwort vergessen?“-Flow auf `/admin/login` verwendet weiterhin genau diese Route auf der jeweils aktuellen Domain.

4. **End-to-End verifizieren**
   - `/admin/login`, Recovery-Link, sichtbares Passwortformular, Passwortänderung und anschließenden Admin-Zugriff prüfen.
   - Danach muss die korrigierte Version veröffentlicht und ein **neues** Recovery-Schreiben angefordert werden; bereits versandte Links behalten ihren bisherigen Zielaufbau.