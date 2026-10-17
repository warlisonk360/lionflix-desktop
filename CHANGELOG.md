# Changelog

Todas as versões publicadas do app desktop do LionFlix.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [0.2.0] - 2026-10-17

### Adicionado
- **Atualização automática** (`electron-updater`): o app verifica sozinho se há
  versão nova na página de Releases e baixa em segundo plano; ao terminar,
  pergunta se pode reiniciar para aplicar.
- **Menu da aplicação** (aparece com `Alt`): *Ajuda → Verificar atualizações…* e
  *Ajuda → Página de downloads*.
- **Fallback de atualização manual**: quando a atualização automática não é
  possível (ex.: rodando fora do `.AppImage`, ou em modo de desenvolvimento),
  o app abre a página de downloads no navegador.
- Metadados de auto-update (`latest-linux.yml` / `latest.yml`) e `.blockmap`
  passam a ser publicados na Release (necessários para as atualizações).

### Alterado
- Nomes dos arquivos publicados agora não têm espaços, para baterem exatamente
  com o que o auto-update espera:
  `LionFlix-<versão>.AppImage`, `LionFlix-Setup-<versão>.exe`,
  `LionFlix-Portable-<versão>.exe`.

### Observação
- A versão **0.1.1** não tinha código de auto-update. Quem estiver nela precisa
  baixar a 0.2.0 **uma vez** manualmente (página de Releases); a partir da 0.2.0
  as próximas versões se atualizam sozinhas.

## [0.1.1] - 2026-10-17

### Corrigido
- Workflow de release: removido o passo `actions/setup-node`, que falhava e
  impedia a geração/publicação dos artefatos. Agora o Node do próprio runner é
  usado.

### Adicionado
- Ícone do app (logo LF) embutido no executável.

## [0.1.0] - 2026-10-17

### Adicionado
- Primeira versão do app desktop (Electron) carregando o site do LionFlix.
- Empacotamento para **Linux (AppImage)** e **Windows (instalador NSIS +
  portátil)**, publicados automaticamente em Releases via GitHub Actions.
