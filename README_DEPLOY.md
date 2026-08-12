# Swaradhyayan – Raaga Knowledge Module

Frontend: static HTML/CSS/JS.
Backend: XML dataset + XQuery REST API, served by **BaseX**'s built-in
HTTP/RESTXQ server.
Web server: **Apache**, serving the frontend and reverse-proxying `/api/*`
to BaseX.
No authentication — every page and endpoint is open, as requested.

```
swaradhyayan/
├── data/raagas.xml          dummy dataset (Bhatkhande Vol. 2 style schema)
├── restxq/api.xqm           XQuery REST API (BaseX RESTXQ module)
├── frontend/                static site (this is the Apache DocumentRoot)
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── apache/swaradhyayan.conf Apache vhost (static site + /api proxy)
└── README_DEPLOY.md         this file
```

The XQuery logic and JSON output in `restxq/api.xqm` were already tested
against `data/raagas.xml` with BaseX's query processor while building this
(9 raagas loaded, filtering, detail, and similar-raaga lookups all verified).
What's left is standing up BaseX's HTTP layer and Apache on your server.

## 1. Install Java + BaseX (full distribution, with HTTP server)

The Debian/Ubuntu `basex` package only ships the standalone query engine —
it does **not** include the bundled Jetty-based HTTP server, so `basexhttp`
won't exist if you install it that way. Use the official full distribution
instead:

```bash
sudo apt install openjdk-21-jre-headless   # or any Java 11+
cd /opt
sudo wget https://files.basex.org/releases/latest/BaseX.zip
sudo unzip BaseX.zip -d basex
sudo ln -s /opt/basex/bin/basexhttp /usr/local/bin/basexhttp
sudo ln -s /opt/basex/bin/basex     /usr/local/bin/basex
```

(If `files.basex.org` isn't reachable from your box, BaseX is also
distributed via their GitHub releases at `github.com/BaseXdb/basex`.)

## 2. Load the dataset into a BaseX database

```bash
cd /path/to/swaradhyayan
basex -c "CREATE DB swaradhyayan data/raagas.xml"
```

Verify it loaded:

```bash
basex -q "count(db:open('swaradhyayan')/raagas/raaga)"
# -> 9
```

## 3. Deploy the RESTXQ module

BaseX's HTTP server auto-discovers RESTXQ modules placed in its `webapp/`
directory:

```bash
cp restxq/api.xqm /opt/basex/webapp/
```

## 4. Start the BaseX HTTP server

```bash
basexhttp
# listens on http://localhost:8984 by default
```

For production, run it as a systemd service instead of a foreground process
— create `/etc/systemd/system/basexhttp.service`:

```ini
[Unit]
Description=BaseX HTTP / RESTXQ server
After=network.target

[Service]
ExecStart=/opt/basex/bin/basexhttp
Restart=on-failure
User=basex

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now basexhttp
```

Sanity check the API directly (before Apache is involved):

```bash
curl http://localhost:8984/raagas
curl http://localhost:8984/raagas/yaman
curl "http://localhost:8984/raagas?thaat=Kalyan"
curl http://localhost:8984/meta/filters
```

## 5. Deploy the frontend + configure Apache

```bash
sudo mkdir -p /var/www/swaradhyayan
sudo cp -r frontend /var/www/swaradhyayan/
sudo a2enmod proxy proxy_http
sudo cp apache/swaradhyayan.conf /etc/apache2/sites-available/
sudo a2ensite swaradhyayan
sudo systemctl reload apache2
```

Point `swaradhyayan.local` (or your real domain / server IP) at the Apache
host, then open it in a browser. `/api/*` requests are transparently proxied
to BaseX on port 8984, so the browser never talks to BaseX directly.

## 6. Expanding the dataset

`data/raagas.xml` currently has 9 illustrative raagas structured after
Bhatkhande's descriptive scheme (Thaat, Jati, Aroh/Avroh, Vadi/Samvadi,
Pakad, Chalan, compositions, etc.) — enough to exercise every feature of
the app. Add more `<raaga>` elements following the same shape, reload the
database (repeat step 2), and restart `basexhttp` (or use `basex -c "OPEN
swaradhyayan" -c "ADD ..."` for incremental updates) — no frontend changes
needed, since the UI is entirely data-driven from the API.

## API reference

| Method | Path                        | Notes                                              |
|--------|-----------------------------|-----------------------------------------------------|
| GET    | `/api/raagas`                | list; optional `q`, `thaat`, `time`, `mood`, `difficulty` |
| GET    | `/api/raagas/{id}`           | full detail for one raaga                          |
| GET    | `/api/raagas/{id}/similar`   | resolved similar-raaga cards                        |
| GET    | `/api/meta/filters`          | distinct thaats / times / difficulties for dropdowns |

## Notes

- Authentication was intentionally left out, per your request. If you want
  it later, the natural place is Apache (Basic Auth / a proxied login) in
  front of the whole vhost, since RESTXQ itself has no built-in user system.
- The "Audio Demos" play buttons generate a short placeholder tone in the
  browser (Web Audio API) since there are no real recordings in the dummy
  dataset — swap in real `<audio>` sources once you have files.
