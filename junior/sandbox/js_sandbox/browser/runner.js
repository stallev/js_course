/**
 * Общий раннер: кнопки [data-fn] вызывают export с тем же именем из exercises.js.
 * console.log дублируется в <pre id="out-{fn}">.
 */
export function initRunner(ex) {
  let activeOutput = null;
  const _log = console.log.bind(console);
  const _error = console.error.bind(console);

  function append(cls, args) {
    if (!activeOutput) return;
    const text = args
      .map((a) =>
        a !== null && typeof a === "object" ? JSON.stringify(a) : String(a)
      )
      .join(" ");
    const line = document.createElement("span");
    line.className = cls;
    line.textContent = text;
    if (activeOutput.childNodes.length > 0) {
      activeOutput.appendChild(document.createTextNode("\n"));
    }
    activeOutput.appendChild(line);
    activeOutput.classList.add("visible");
    activeOutput.scrollTop = activeOutput.scrollHeight;
  }

  console.log = (...a) => {
    _log(...a);
    append("log", a);
  };
  console.error = (...a) => {
    _error(...a);
    append("err", a);
  };

  document.querySelectorAll(".btn-run").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const fnName = btn.dataset.fn;
      const outputEl = document.getElementById("out-" + fnName);
      const fn = ex[fnName];
      if (!outputEl) return;
      if (typeof fn !== "function") {
        outputEl.textContent = "Нет export function " + fnName + " в exercises.js";
        outputEl.classList.add("visible");
        return;
      }
      outputEl.textContent = "";
      outputEl.classList.add("visible");
      const info = document.createElement("span");
      info.className = "info";
      info.textContent = "Выполняется...";
      outputEl.appendChild(info);
      await new Promise((r) => setTimeout(r, 0));
      outputEl.textContent = "";
      activeOutput = outputEl;
      btn.disabled = true;
      try {
        await fn();
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        append("err", ["Ошибка: " + err.message]);
      } finally {
        activeOutput = null;
        btn.disabled = false;
      }
      if (!outputEl.hasChildNodes()) {
        const done = document.createElement("span");
        done.className = "info";
        done.textContent = "Готово (нет console.log)";
        outputEl.appendChild(done);
      }
    });
  });

  document.querySelectorAll(".btn-clear").forEach((btn) => {
    btn.addEventListener("click", () => {
      const outputEl = document.getElementById("out-" + btn.dataset.clear);
      if (!outputEl) return;
      outputEl.textContent = "";
      outputEl.classList.remove("visible");
    });
  });
}
