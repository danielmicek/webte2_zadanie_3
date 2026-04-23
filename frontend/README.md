# Technická správa k zadaniu 3

## 1. Prehľad architektúry

Frontend: React + Vite (`frontend/`)  
Backend: Node.js + knižnica `ws` (`backend/`)  
Renderovanie hry: Canvas API  
Realtime komunikácia: WebSocket cez Nginx reverse proxy  
Konfigurácia hry: externý JSON súbor (`/home/xmicek/curling-game-config/game-config.json`)

## 2. Zmeny konfigurácii VPS alebo servera

Na serveri bol použitý webový server Nginx. Frontend aplikácia bola nasadená do priečinka:

`/var/www/node71.webte.fei.stuba.sk/zadanie3`

WebSocket backend bol nasadený ako samostatná Node.js aplikácia do priečinka:

`/home/xmicek/ws-curling/backend`

Keďže WebSocket server beží ako samostatný proces na porte `3000`, bolo potrebné doplniť do konfigurácie virtuálneho hosta Nginxu reverse proxy pre WebSocket spojenie:

```nginx
location /ws/ {
    proxy_pass http://localhost:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
}
```

Keďže frontend načítava hernú konfiguráciu cez `fetch('/game-config.json')`, bolo potrebné sprístupniť externý JSON súbor cez Nginx pomocou `alias`:

```nginx
location /game-config.json {
    alias /home/xmicek/curling-game-config/game-config.json;
}
```

Pre frontend nasadený v podadresári `/zadanie3/` bolo potrebné doplniť aj pravidlo pre SPA routing:

```nginx
location /zadanie3/ {
    try_files $uri $uri/ /zadanie3/index.html;
}
```

Po úprave konfigurácie bol Nginx otestovaný a reštartovaný:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 3. Zmeny v zadani_3

Nasadenie backend časti:
- backend bol ponechaný mimo web rootu v `/home/xmicek/ws-curling/backend`
- na server bol skopírovaný celý priečinok `backend/` bez `node_modules`
- závislosti boli doinštalované cez `npm install`

Nasadenie frontend časti:
- frontend build bol nasadený do `/var/www/node71.webte.fei.stuba.sk/zadanie3`

Úprava konfigurácie hry:
- konfigurácia sa nachádza na:
  `/home/xmicek/curling-game-config/game-config.json`
- frontend načítava konfiguráciu cez `fetch('/game-config.json')`
- backend číta tú istú konfiguráciu priamo zo súborového systému

Úprava práv k externému JSON súboru:
- kvôli sprístupneniu súboru cez Nginx bolo potrebné umožniť prechod do priečinka `/home/xmicek`
- bola vykonaná zmena práv:
  `chmod o+x /home/xmicek`

Nasadenie WebSocket servera ako systemd služby:
- bol vytvorený service súbor:
  `/etc/systemd/system/ws-curling.service`


## 4. WebSocket server a systémová služba

Backend je spúšťaný ako systemd služba cez:

`/etc/systemd/system/ws-curling.service`

Použitá konfigurácia:

```ini
[Unit]
Description=WebSocket Chat Server
After=network.target

[Service]
WorkingDirectory=/home/xmicek/ws-curling/backend
ExecStart=/home/xmicek/.nvm/versions/node/v24.14.1/bin/node src/server.js
Restart=always
User=xmicek

[Install]
WantedBy=multi-user.target
```

Po vytvorení a úprave služby boli použité tieto príkazy:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ws-curling
sudo systemctl status ws-curling
```

Overenie aktivity backendu:

```bash
sudo lsof -i :3000
```

## 5. Aktuálne umiestnenie súborov

Frontend build:  
`/var/www/node71.webte.fei.stuba.sk/zadanie3`

Frontend assety:  
`/var/www/node71.webte.fei.stuba.sk/zadanie3/assets`

WebSocket backend:  
`/home/xmicek/ws-curling/backend`

Vstupný server súbor backendu:  
`/home/xmicek/ws-curling/backend/src/server.js`

Externý JSON config:  
`/home/xmicek/curling-game-config/game-config.json`

Nginx virtual host konfigurácia:  
`/etc/nginx/sites-available/node71.webte.fei.stuba.sk`

Systemd service:  
`/etc/systemd/system/ws-curling.service`
