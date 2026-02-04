async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const COPY_ICON_SVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>`;

export function attachCopyButtonsToCodeBlocks(container: HTMLElement): void {
  const codeBlocks = container.querySelectorAll("pre");
  codeBlocks.forEach((pre) => {
    // Skip if already has copy button
    if (pre.querySelector(".code-block-copy-btn")) {
      return;
    }

    const code = pre.querySelector("code");
    const text = code?.textContent || pre.textContent || "";

    if (!text.trim()) {
      return;
    }

    const button = document.createElement("button");
    button.className = "code-block-copy-btn";
    button.type = "button";
    button.setAttribute("aria-label", "Copy code");
    button.title = "Copy code";
    button.innerHTML = `<span class="code-block-copy-btn__icon" aria-hidden="true">${COPY_ICON_SVG}</span>`;

    let copiedTimeout: number | null = null;
    button.addEventListener("click", async () => {
      if (button.dataset.copying === "1") {
        return;
      }

      button.dataset.copying = "1";
      button.disabled = true;
      button.setAttribute("aria-busy", "true");

      const copied = await copyTextToClipboard(text);

      if (!button.isConnected) {
        return;
      }

      button.dataset.copying = "";
      button.disabled = false;
      button.removeAttribute("aria-busy");

      if (copied) {
        button.dataset.copied = "1";
        button.setAttribute("aria-label", "Copied!");
        button.title = "Copied!";

        if (copiedTimeout !== null) {
          window.clearTimeout(copiedTimeout);
        }
        copiedTimeout = window.setTimeout(() => {
          if (!button.isConnected) {
            return;
          }
          button.dataset.copied = "";
          button.setAttribute("aria-label", "Copy code");
          button.title = "Copy code";
        }, 2000);
      } else {
        button.dataset.error = "1";
        button.setAttribute("aria-label", "Copy failed");
        button.title = "Copy failed";

        if (copiedTimeout !== null) {
          window.clearTimeout(copiedTimeout);
        }
        copiedTimeout = window.setTimeout(() => {
          if (!button.isConnected) {
            return;
          }
          button.dataset.error = "";
          button.setAttribute("aria-label", "Copy code");
          button.title = "Copy code";
        }, 2000);
      }
    });

    pre.style.position = "relative";
    pre.appendChild(button);
  });
}
