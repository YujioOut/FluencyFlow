document.addEventListener("DOMContentLoaded", () => {
  const languageScreen = document.getElementById("language-screen");
  const app = document.getElementById("app");
  const startButton = document.getElementById("startButton");

  startButton.addEventListener("click", () => {
    const selectedLanguage = document.getElementById("languageSelector").value;
    languageScreen.style.display = "none";
    app.style.display = "block";
    initFluencyFlow(selectedLanguage);
  });
});

function initFluencyFlow(language) {
  // Return to language selector
  document
    .getElementById("returnToLanguageBtn")
    .addEventListener("click", () => {
      document.getElementById("app").style.display = "none";
      document.getElementById("language-screen").style.display = "block";
    });

  // Helpers and flags
  const storageKey = (type) => `${type}-${language}`;
  const isFrench = language === "french";

  // Load saved state
  let selectedItems =
    JSON.parse(localStorage.getItem(storageKey("selectedItems"))) || {};
  let isHidingKnownWords =
    JSON.parse(localStorage.getItem(storageKey("isHiding"))) || false;
  let displayStartIndex = parseInt(
    localStorage.getItem(storageKey("startIndex")) || "0",
    10
  );

  // CSV and column mapping
  const csvMap = {
    japanese: "japanese.csv",
    chinese: "chinese.csv",
    french: "french.csv",
  };
  const columnMap = {
    japanese: {
      word: "Kanji",
      alt: "Kana",
      translation: "English",
      alt2: "Romaji",
    },
    chinese: { word: "Hanzi", alt: "Pinyin", translation: "English" },
    french: { word: "French", translation: "English", example: "Example" },
  };
  const csvFile = csvMap[language];
  const map = columnMap[language];

  // Toggle states based on available columns
  let showKana = !!map.alt;
  let showRomaji = !!map.alt2;
  let showEnglish = !!map.translation;
  let showExample = !!map.example;

  // Persist state
  function saveProgress() {
    localStorage.setItem(
      storageKey("selectedItems"),
      JSON.stringify(selectedItems)
    );
    localStorage.setItem(
      storageKey("isHiding"),
      JSON.stringify(isHidingKnownWords)
    );
    localStorage.setItem(
      storageKey("startIndex"),
      displayStartIndex.toString()
    );
  }

  // Responsive table header
  function updateTableHeader() {
    const width = window.innerWidth;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    let headers;

    if (isFrench) {
      const frenchNums = [
        "un",
        "deux",
        "trois",
        "quatre",
        "cinq",
        "six",
        "sept",
        "huit",
        "neuf",
        "dix",
      ];
      if (width < 768 || (isTouch && width < 1024))
        headers = frenchNums.slice(0, 4);
      else if (width < 1300) headers = frenchNums.slice(0, 6);
      else headers = frenchNums;
    } else {
      if (width < 768 || (isTouch && width < 1024))
        headers = ["一", "二", "三", "四"];
      else if (width < 1300) headers = ["一", "二", "三", "四", "五", "六"];
      else
        headers = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
    }

    document.getElementById("table-header").innerHTML = headers
      .map((h) => `<th>${h}</th>`)
      .join("");
  }

  // Update known count & page display
  function updateKnownCount() {
    document.getElementById("known-count").textContent =
      Object.keys(selectedItems).length;
  }
  function updatePageDisplay() {
    if (!filteredIndex.length) return;
    const first = filteredIndex[displayStartIndex] || 0;
    document.getElementById("current-index").textContent = (
      first / 100 +
      1
    ).toFixed(2);
  }

  // Chinese video embed
  function updateVideoEmbed() {
    const container = document.getElementById("video-container");
    if (language !== "chinese" || isHidingKnownWords) {
      container.style.display = "none";
      return;
    }
    const urls = [
      "https://www.youtube.com/embed/5ZmgiEcfN7U",
      "https://www.youtube.com/embed/w9m6bPczqoc",
      "https://www.youtube.com/embed/4TvMvpVg0Z4?si=wsP1NmtfkinWRZyS",
      "https://www.youtube.com/embed/yb6R23cKPy4?si=zE6m4__VwMA1AkSi",
    ];
    const idx = Math.floor(displayStartIndex / 100);
    if (idx >= 0 && idx < urls.length) {
      container.innerHTML = `<iframe width="100%" height="200" src="${urls[idx]}" frameborder="0" allowfullscreen></iframe>`;
      container.style.display = "block";
    } else container.style.display = "none";
  }

  // Export helpers
  function exportKnownWords() {
    const list = Object.values(selectedItems).map((e) => e[map.word] || "");
    if (!list.length) return alert("No known words to copy.");
    navigator.clipboard
      .writeText(list.join("\n"))
      .then(() => alert("Known words copied!"));
  }
  function exportNext20Unknown(parsed) {
    const page = filteredIndex.slice(
      displayStartIndex,
      displayStartIndex + 100
    );
    const unknown = page.filter((i) => !selectedItems[i]).slice(0, 20);
    const list = unknown.map((i) => parsed[i][map.word] || "");
    if (!list.length) return alert("No unknown words left.");
    navigator.clipboard
      .writeText(list.join("\n"))
      .then(() => alert("Next 20 unknown words copied!"));
  }

  window.addEventListener("resize", () => {
    updateTableHeader();
    renderTable();
  });
  updateTableHeader();

  // Load CSV and render
  let filteredIndex = [];
  fetch(csvFile)
    .then((r) => r.text())
    .then((text) => {
      const data = Papa.parse(text, { header: true }).data;
      filteredIndex = data.map((_, i) => i);
      if (isHidingKnownWords)
        filteredIndex = filteredIndex.filter((i) => !selectedItems[i]);

      function renderTable() {
        const tbody = document.querySelector("#vocabTable tbody");
        tbody.innerHTML = "";
        const cols =
          window.innerWidth < 768 ? 4 : window.innerWidth < 1300 ? 6 : 10;
        let row;
        filteredIndex
          .slice(displayStartIndex, displayStartIndex + 100)
          .forEach((i, idx) => {
            if (idx % cols === 0) {
              row = document.createElement("tr");
              tbody.appendChild(row);
            }
            const e = data[i];
            const cell = document.createElement("td");
            if (isFrench) {
              cell.style.padding = "1em";
              cell.style.lineHeight = "1.4";
              cell.style.minHeight = "4em";
            }
            const parts = [];
            parts.push(e[map.word] || "");
            if (map.alt && showKana) parts.push(e[map.alt] || "");
            if (map.alt2 && showRomaji) parts.push(e[map.alt2] || "");
            if (showEnglish) parts.push(e[map.translation] || "");
            if (map.example && showExample) parts.push(e[map.example] || "");
            const joiner = isFrench ? "<br><br>" : "<br>";
            cell.innerHTML = parts.join(joiner);
            if (selectedItems[i]) cell.classList.add("selected");
            cell.addEventListener("click", () => {
              if (cell.classList.toggle("selected")) selectedItems[i] = e;
              else delete selectedItems[i];
              saveProgress();
              updateKnownCount();
            });
            row.appendChild(cell);
          });
        updateKnownCount();
        updatePageDisplay();
        updateVideoEmbed();
        saveProgress();
      }

      renderTable();

      // Controls
      document.getElementById("exportButton").onclick = exportKnownWords;
      document.getElementById("exportNext20Button").onclick = () =>
        exportNext20Unknown(data);
      document.getElementById("nextButton").onclick = () => {
        if (displayStartIndex + 100 < filteredIndex.length) {
          displayStartIndex += 100;
          renderTable();
        }
      };
      document.getElementById("prevButton").onclick = () => {
        if (displayStartIndex - 100 >= 0) {
          displayStartIndex -= 100;
          renderTable();
        }
      };
      document.getElementById("hideKnownButton").onclick = () => {
        isHidingKnownWords = true;
        filteredIndex = filteredIndex.filter((i) => !selectedItems[i]);
        displayStartIndex = Math.min(
          displayStartIndex,
          filteredIndex.length - 100
        );
        renderTable();
      };
      document.getElementById("showAllButton").onclick = () => {
        isHidingKnownWords = false;
        filteredIndex = data.map((_, i) => i);
        displayStartIndex = Math.floor(displayStartIndex / 100) * 100;
        selectedItems =
          JSON.parse(localStorage.getItem(storageKey("selectedItems"))) || {};
        renderTable();
      };
      document.getElementById("resetButton").onclick = () => {
        selectedItems = {};
        filteredIndex = data.map((_, i) => i);
        displayStartIndex = 0;
        isHidingKnownWords = false;
        localStorage.removeItem(storageKey("selectedItems"));
        localStorage.removeItem(storageKey("startIndex"));
        localStorage.removeItem(storageKey("isHiding"));
        renderTable();
      };

      // Dynamic toggles
      const toggleContainer = document.getElementById("toggleButtons");
      toggleContainer.innerHTML = "";
      const toggles = [];
      if (map.alt) toggles.push({ state: "showKana", label: map.alt });
      if (map.alt2) toggles.push({ state: "showRomaji", label: map.alt2 });
      if (map.translation)
        toggles.push({ state: "showEnglish", label: "English" });
      if (map.example)
        toggles.push({ state: "showExample", label: map.example });
      toggles.forEach(({ state, label }) => {
        let visible = eval(state);
        const btn = document.createElement("button");
        btn.id = `toggle${label}Button`;
        btn.textContent = visible ? `Hide ${label}` : `Show ${label}`;
        btn.addEventListener("click", () => {
          if (state === "showKana")
            (showKana = !showKana), (visible = showKana);
          if (state === "showRomaji")
            (showRomaji = !showRomaji), (visible = showRomaji);
          if (state === "showEnglish")
            (showEnglish = !showEnglish), (visible = showEnglish);
          if (state === "showExample")
            (showExample = !showExample), (visible = showExample);
          btn.textContent = visible ? `Hide ${label}` : `Show ${label}`;
          renderTable();
        });
        toggleContainer.appendChild(btn);
      });

      // Theme selector
      const themeSelector = document.getElementById("themeSelector");
      const themeStylesheet = document.getElementById("themeStylesheet");
      const saved = localStorage.getItem("user-theme") || "cosmic";
      themeSelector.value = saved;
      themeStylesheet.href = `../themes/Theme-${saved}.css`;
      themeSelector.onchange = (e) => {
        const v = e.target.value;
        themeStylesheet.href = `../themes/Theme-${v}.css`;
        localStorage.setItem("user-theme", v);
      };
    })
    .catch((err) => console.error("CSV load error:", err));
}
