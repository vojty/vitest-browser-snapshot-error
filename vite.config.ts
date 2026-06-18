import { defineConfig, Plugin } from "vite";
import { TestProjectConfiguration } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

const browserTestConfig: TestProjectConfiguration = {
  extends: true,
  test: {
    name: "browser",
    testTimeout: 5_000,
    browser: {
      enabled: true,
      provider: playwright({
        contextOptions: { locale: "en-US" },
      }),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
  },
};

export const noncePlugin = (nonce: string): Plugin => ({
  name: "add-nonce-script-attr",
  enforce: "post",
  transformIndexHtml(html) {
    return html.replace(new RegExp("<script", "g"), `<script nonce="${nonce}"`);
  },
});

export default defineConfig((configEnv) => {
  const nonce = "123456789abcdef";
  return {
    plugins: [noncePlugin(nonce)],
    test: {
      projects: [browserTestConfig],
    },
    server: {
      headers: {
        "Content-Security-Policy": `script-src 'nonce-${nonce}'`,
      },
    },
  };
});
