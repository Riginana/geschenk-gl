## Ziel
Eine neue Recovery-E-Mail an `kontakt.diginutz@gmail.com` senden, die zuverlässig auf `/reset-password` führt.

## Wichtige Voraussetzung
Der korrigierte Recovery-Flow (Interceptor in `__root.tsx` + validierte Session in `reset-password.tsx`) ist aktuell nur in der Preview-Version aktiv. Damit der Link in der E-Mail (der auf die Live-Domain `geschenk-gl.lovable.app` zeigt) funktioniert, muss die App **vor** dem Mailversand veröffentlicht werden.

## Schritte
1. Prüfen, ob die aktuellen Änderungen live sind; falls nicht, Publish anstoßen (Klick durch dich im Publish-Dialog).
2. Recovery-E-Mail über die Admin-API auslösen, mit explizitem `redirect_to` = `https://geschenk-gl.lovable.app/reset-password`.
3. Auth-Logs prüfen, ob der Versand registriert wurde (Rate-Limit von Standard-Mails beachten: max. wenige Mails/Stunde).
4. Falls der Versand blockiert wird oder die Mail erneut im Spam landet: alternativ einen direkten, einmalig gültigen Recovery-Link generieren und dir hier im Chat ausgeben, damit das Passwort ohne E-Mail gesetzt werden kann.

## Hinweis
Alte Links aus früheren E-Mails bleiben ungültig – bitte nur den neuesten Link verwenden.
