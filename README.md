# LionFlix Desktop

App desktop do [LionFlix](https://www.lionflix.com.br) feito com **Electron**
(Chromium embutido).

## Download

Pegue a versão mais recente na aba **[Releases](../../releases)**:

| Sistema | Arquivo |
|---|---|
| Linux | `LionFlix-<versão>.AppImage` |
| Windows | `LionFlix Setup <versão>.exe` (instalador) ou `LionFlix <versão>.exe` (portátil) |

### Linux (AppImage)
```bash
chmod +x LionFlix-*.AppImage
./LionFlix-*.AppImage
```
Se aparecer erro de sandbox em alguma distro:
```bash
./LionFlix-*.AppImage --no-sandbox
```

## Por que Electron?
O player de vídeo do LionFlix é um `<iframe>` do **Google Drive**
(`drive.google.com/file/d/<id>/preview`). O Chromium embutido do Electron toca
esse player exatamente como o Chrome, e já vem com os códecs (H.264/AAC) — não
depende do sistema. Motores baseados no WebView do sistema (Tauri/Wails no
Linux = WebKitGTK) costumam quebrar o player do Drive.

## Desenvolvimento

Requisitos: Node.js 18+ e pnpm.

```bash
pnpm install
pnpm start            # abre o site online (https://www.lionflix.com.br)
```

Variáveis opcionais:
```bash
LIONFLIX_URL=https://outra-url.com pnpm start   # aponta para outra URL
```

## Gerar o pacote localmente
```bash
pnpm dist:linux       # -> dist/LionFlix-<versão>.AppImage
pnpm dist:win         # -> dist/*.exe (melhor rodar no Windows)
```

## Publicar uma versão
1. Atualize `version` no `package.json` (ex.: `0.2.0`).
2. Commite e crie a tag:
   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```
3. O GitHub Actions builda Linux + Windows e cria a **Release** com os arquivos
   anexados automaticamente.

## Estrutura
```
.
├── main.js                # processo principal do Electron
├── preload.js             # ponte mínima (contextIsolation)
├── electron-builder.yml   # empacotamento (AppImage / Windows)
├── pnpm-workspace.yaml    # config do pnpm (nodeLinker hoisted, builds)
├── build/icon.png         # ícone do app (512×512)
└── .github/workflows/     # CI que gera e publica as Releases
```

## Notas técnicas
- `main.js` fixa um **User-Agent de Chrome** — o Google Drive recusa o UA
  padrão do Electron ("Electron/...").
- `nodeIntegration` desligado e `contextIsolation` ligado (padrão seguro).
- Links externos abrem no **navegador padrão**, não dentro do app.
- Instância única: abrir o app de novo apenas foca a janela existente.
