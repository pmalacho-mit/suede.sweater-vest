import path from "node:path";
import * as vscode from "vscode";

import { pageKey } from "./discovery.ts";
import { ID, folderOf } from "./editor.ts";

const setting = <T>(key: string, fallback: T) => vscode.workspace.getConfiguration(ID).get<T>(key, fallback);

type Server = { url: string; external: boolean };

// what the plugin was configured with, asked of the running server: see `external` in its options
const CONFIG_ENDPOINT = "/__sweater-vest/config.json";

const configuredExternal = async (local: string): Promise<string | null> => {
  try {
    const response = await fetch(`${local}${CONFIG_ENDPOINT}`, { signal: AbortSignal.timeout(1500) });
    const { external } = (await response.json()) as { external?: string | null };
    return typeof external === "string" ? external : null;
  } catch {
    return null;
  }
};

/**
 * Where to open the dev server: the address it says a browser outside reaches
 * it at (the plugin's `external` option — a container's published port), used
 * as is; else its own port on the extension host, to be tunnelled.
 */
const devServer = async (): Promise<Server> => {
  const local = setting("devServer", "http://localhost:5173").replace(/\/$/, "");
  const external = await configuredExternal(local);
  return external ? { url: external, external: true } : { url: local, external: false };
};

/** The dev server's page for a snippet, and whether its address is already reachable from outside. */
export async function pageUrl(uri: vscode.Uri, snippet: string): Promise<{ url: URL; external: boolean }> {
  const folder = folderOf(uri);
  const server = await devServer();
  const route = setting("pagesRoute", "/vests").replace(/\/$/, "");
  const base = server.url.replace(/\/$/, "");
  return { url: new URL(`${base}${route}/${pageKey(path.relative(folder, uri.fsPath), snippet)}`), external: server.external };
}

const panels = new Map<string, vscode.WebviewPanel>();

const html = (url: URL) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${url.origin}; style-src 'unsafe-inline';" />
    <style>html, body, iframe { margin: 0; padding: 0; width: 100%; height: 100%; border: 0; }</style>
  </head>
  <body><iframe src="${url.href}" allow="clipboard-read; clipboard-write"></iframe></body>
</html>`;

/**
 * The page inside the editor. An address that is already reachable from
 * outside is used as is; otherwise the webview's `localhost:<port>` is
 * tunnelled by the editor to the extension host's.
 */
function showInWebview(name: string, url: URL, external: boolean) {
  const existing = panels.get(name);
  if (existing) {
    existing.webview.html = html(url); // reloads it
    return existing.reveal(vscode.ViewColumn.Beside, true);
  }
  const port = Number(url.port || (url.protocol === "https:" ? 443 : 80));
  const panel = vscode.window.createWebviewPanel(`${ID}.page`, name, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }, {
    enableScripts: true,
    retainContextWhenHidden: true,
    ...(external ? {} : { portMapping: [{ webviewPort: port, extensionHostPort: port }] }),
  });
  panel.webview.html = html(url);
  panel.onDidDispose(() => panels.delete(name));
  panels.set(name, panel);
}

export async function openPage(uri: vscode.Uri, snippet: string, name: string) {
  const { url, external } = await pageUrl(uri, snippet);
  if (setting<"webview" | "browser">("openIn", "webview") === "browser") {
    const target = vscode.Uri.parse(url.href);
    return vscode.env.openExternal(external ? target : await vscode.env.asExternalUri(target));
  }
  showInWebview(name, url, external);
}
