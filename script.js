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
  const storageKey = (type) => `${type}-${language}`;

  let selectedItems =
    JSON.parse(localStorage.getItem(storageKey("selectedItems"))) || {};
  let isHidingKnownWords =
    JSON.parse(localStorage.getItem(storageKey("isHiding"))) || false;
  let displayStartIndex = parseInt(
    localStorage.getItem(storageKey("startIndex")) || "0"
  );
  let showRomaji = true;
  let showKana = true;
  let showEnglish = true;
  let filteredIndex = [];

  const csvMap = {
    japanese: "japanese.csv",
    chinese: "chinese.csv",
  };
  const csvFile = csvMap[language];
  const tableHeader = document.getElementById("table-header");

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
    document
      .getElementById("returnToLanguageBtn")
      .addEventListener("click", () => {
        document.getElementById("app").style.display = "none";
        document.getElementById("language-screen").style.display = "block";
      });
  }

  function updateTableHeader() {
    const width = window.innerWidth;
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    let headers;

    if (width < 768 || (isTouchDevice && width < 1024)) {
      headers = ["一", "二", "三", "四"];
    } else if (width < 1300) {
      headers = ["一", "二", "三", "四", "五", "六"];
    } else {
      headers = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
    }

    tableHeader.innerHTML = "";
    headers.forEach((symbol) => {
      const th = document.createElement("th");
      th.textContent = symbol;
      tableHeader.appendChild(th);
    });
  }

  function updateKnownCount() {
    document.getElementById("known-count").textContent =
      Object.keys(selectedItems).length;
  }

  function updatePageDisplay() {
    if (filteredIndex.length === 0) return;
    let firstWordIndex = filteredIndex[displayStartIndex];
    let pageNumber = firstWordIndex / 100 + 1;
    document.getElementById("current-index").textContent =
      pageNumber.toFixed(2);
  }

  function updateVideoEmbed() {
    const videoContainer = document.getElementById("video-container");

    if (language !== "chinese" || isHidingKnownWords) {
      videoContainer.style.display = "none";
      videoContainer.innerHTML = "";
      return;
    }

    const videoURLs = [
      "https://www.youtube.com/embed/5ZmgiEcfN7U",
      "https://www.youtube.com/embed/w9m6bPczqoc",
      "https://www.youtube.com/embed/4TvMvpVg0Z4?si=wsP1NmtfkinWRZyS",
    ];

    const page = Math.floor(displayStartIndex / 100);

    if (page >= 0 && page <= 2) {
      videoContainer.innerHTML = `
       
        <iframe width="100%" height="200"
          src="${videoURLs[page]}"
          frameborder="0" allowfullscreen>
        </iframe>`;
      videoContainer.style.display = "block";
    } else {
      videoContainer.style.display = "none";
      videoContainer.innerHTML = "";
    }
  }

  function exportKnownWords() {
    const knownWords = Object.values(selectedItems).map(
      (entry) => entry.Kanji || entry.Hanzi || ""
    );
    if (knownWords.length === 0)
      return alert("You haven't selected any known words yet.");
    navigator.clipboard
      .writeText(knownWords.join("\n"))
      .then(() => alert("Known words copied to clipboard!"));
  }

  function exportNext20UnknownWords(parsedData) {
    const currentPage = filteredIndex.slice(
      displayStartIndex,
      displayStartIndex + 100
    );
    const unknownWords = currentPage.filter((index) => !selectedItems[index]);
    const next20 = unknownWords
      .slice(0, 20)
      .map((index) => parsedData[index].Kanji || parsedData[index].Hanzi || "");

    if (next20.length === 0)
      return alert("No unknown words found on this page.");
    navigator.clipboard
      .writeText(next20.join("\n"))
      .then(() => alert("Next 20 unknown words copied to clipboard!"));
  }

  window.addEventListener("resize", () => {
    updateTableHeader();
    renderTable();
  });

  updateTableHeader();

  fetch(csvFile)
    .then((response) => response.text())
    .then((csvText) => {
      const parsedData = Papa.parse(csvText, { header: true }).data;
      filteredIndex = [...Array(parsedData.length).keys()];

      if (isHidingKnownWords) {
        filteredIndex = filteredIndex.filter((index) => !selectedItems[index]);
      }

      function renderTable() {
        const tableBody = document.querySelector("#vocabTable tbody");
        tableBody.innerHTML = "";
        const columns =
          window.innerWidth < 768 ? 4 : window.innerWidth < 1300 ? 6 : 10;
        let row;

        const wordsToShow = filteredIndex.slice(
          displayStartIndex,
          displayStartIndex + 100
        );
        const wordsData = wordsToShow.map((index) => ({
          entry: parsedData[index],
          originalIndex: index,
        }));

        wordsData.forEach(({ entry, originalIndex }, index) => {
          if (index % columns === 0) {
            row = document.createElement("tr");
            tableBody.appendChild(row);
          }

          const td = document.createElement("td");
          td.innerHTML =
            (entry.Kanji || entry.Hanzi || "") +
            "<br>" +
            (showKana ? (entry.Kana || "") + "<br>" : "") +
            (showEnglish ? (entry.English || "") + "<br>" : "") +
            (showRomaji ? entry.Romaji || entry.Pinyin || "" : "");

          if (selectedItems[originalIndex]) td.classList.add("selected");

          td.addEventListener("click", () => {
            td.classList.toggle("selected");
            if (td.classList.contains("selected")) {
              selectedItems[originalIndex] = entry;
            } else {
              delete selectedItems[originalIndex];
            }
            saveProgress();
            updateKnownCount();
          });

          row.appendChild(td);
        });

        updateKnownCount();
        updatePageDisplay();
        updateVideoEmbed(); // 🔥 Now called here!
        saveProgress();
      }

      renderTable();

      document.getElementById("nextButton").addEventListener("click", () => {
        if (displayStartIndex + 100 < filteredIndex.length) {
          displayStartIndex += 100;
          renderTable();
        }
      });

      document.getElementById("prevButton").addEventListener("click", () => {
        if (displayStartIndex - 100 >= 0) {
          displayStartIndex -= 100;
          renderTable();
        }
      });

      document
        .getElementById("hideKnownButton")
        .addEventListener("click", () => {
          isHidingKnownWords = true;
          filteredIndex = filteredIndex.filter(
            (index) => !selectedItems[index]
          );
          displayStartIndex = Math.min(
            displayStartIndex,
            filteredIndex.length - 100
          );
          renderTable();
        });

      document.getElementById("showAllButton").addEventListener("click", () => {
        isHidingKnownWords = false;
        filteredIndex = [...Array(parsedData.length).keys()];
        displayStartIndex = Math.floor(displayStartIndex / 100) * 100;
        selectedItems =
          JSON.parse(localStorage.getItem(storageKey("selectedItems"))) || {};
        renderTable();
      });

      document.getElementById("resetButton").addEventListener("click", () => {
        selectedItems = {};
        filteredIndex = [...Array(parsedData.length).keys()];
        displayStartIndex = 0;
        isHidingKnownWords = false;
        localStorage.removeItem(storageKey("selectedItems"));
        localStorage.removeItem(storageKey("startIndex"));
        localStorage.removeItem(storageKey("isHiding"));
        renderTable();
      });

      document
        .getElementById("exportButton")
        .addEventListener("click", exportKnownWords);
      document
        .getElementById("exportNext20Button")
        .addEventListener("click", () => exportNext20UnknownWords(parsedData));

      document
        .getElementById("toggleRomajiButton")
        .addEventListener("click", () => {
          showRomaji = !showRomaji;
          renderTable();
        });

      document
        .getElementById("toggleKanaButton")
        .addEventListener("click", () => {
          showKana = !showKana;
          renderTable();
        });

      document
        .getElementById("toggleEnglishButton")
        .addEventListener("click", () => {
          showEnglish = !showEnglish;
          renderTable();
        });

      const themeSelector = document.getElementById("themeSelector");
      const themeStylesheet = document.getElementById("themeStylesheet");
      const savedTheme = localStorage.getItem("user-theme") || "cosmic";
      themeSelector.value = savedTheme;
      themeStylesheet.href = `../themes/Theme-${savedTheme}.css`;

      themeSelector.addEventListener("change", (e) => {
        const selectedTheme = e.target.value;
        themeStylesheet.href = `../themes/Theme-${selectedTheme}.css`;
        localStorage.setItem("user-theme", selectedTheme);
      });
    });
}
