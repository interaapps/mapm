# mapm
## A simple Import Map Package Manager
Install any npm packages without any build steps

```bash
npm i -g mapm
```

## Install into import-map.json
```bash
mapm install pulsjs
```

## Install into HTML file
```bash
mapm install -f index.html pulsjs
```

## Link from html
Adds import map automatically
```bash
mapm link -o index.html index.html
```

## mapm.json
```json
{
  "file": "index.html",
  "provider": "esm.sh"
}
```

## Providers:
- esm.sh
- esm.run
- unpkg
- skypack