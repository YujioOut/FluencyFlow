document.addEventListener("DOMContentLoaded", () => {
  let selectedItems = JSON.parse(localStorage.getItem("selectedItems")) || {};
  let isHidingKnownWords = false;
  let showRomaji = true;
  let showKana = true;
  let showEnglish = true;
  let filteredIndex = [];
  let displayStartIndex = 0;

  const tableHeader = document.getElementById("table-header");

  function updateTableHeader() {
    const width = window.innerWidth;
    let headers;

    if (width < 768) {
      headers = ["一", "二", "三", "四"];
    } else if (width < 1300) {
      headers = ["一", "二", "三", "四", "五", "六"];
    } else {
      headers = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
    }

    const tableHeader = document.getElementById("table-header");
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

  function exportKnownWords() {
    let knownWords = Object.values(selectedItems).map(
      (entry) => `${entry.Kanji}`
    );

    if (knownWords.length === 0) {
      alert("You haven't selected any known words yet.");
      return;
    }

    let textToCopy = knownWords.join("\n");

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => alert("Known words copied to clipboard!"))
      .catch(() =>
        alert(
          "Failed to copy. Try manually copying the text below.\n\n" +
            textToCopy
        )
      );
  }

  function exportNext20UnknownWords(parsedData) {
    const currentPage = filteredIndex.slice(
      displayStartIndex,
      displayStartIndex + 100
    );
    const unknownWords = currentPage.filter((index) => !selectedItems[index]);
    const next20 = unknownWords
      .slice(0, 20)
      .map((index) => parsedData[index].Kanji || parsedData[index].Hanzi);

    if (next20.length === 0) {
      alert("No unknown words found on this page.");
      return;
    }

    const textToCopy = next20.join("\n");

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => alert("Next 20 unknown words copied to clipboard!"))
      .catch(() =>
        alert(
          "Failed to copy. Try manually copying the text below.\n\n" +
            textToCopy
        )
      );
  }

  window.addEventListener("resize", updateTableHeader);
  updateTableHeader();

  fetch("vocab_list.csv")
    .then((response) => response.text())
    .then((csvText) => {
      const parsedData = Papa.parse(csvText, { header: true }).data;
      filteredIndex = [...Array(parsedData.length).keys()];

      function renderTable() {
        const tableBody = document.querySelector("#vocabTable tbody");
        tableBody.innerHTML = "";
        let columns = window.innerWidth < 768 ? 4 : 10;

        let wordsToShow = filteredIndex.slice(
          displayStartIndex,
          displayStartIndex + 100
        );
        let wordsData = wordsToShow.map((index) => ({
          entry: parsedData[index],
          originalIndex: index,
        }));

        wordsData.forEach(({ entry, originalIndex }, index) => {
          if (index % columns === 0) {
            row = document.createElement("tr");
            tableBody.appendChild(row);
          }

          const td = document.createElement("td");
          td.innerHTML = `
            ${entry.Kanji}<br>
            ${showKana ? entry.Kana : ""}<br>
            ${showEnglish ? entry.English : ""}<br>
            ${showRomaji ? entry.Romaji : ""}
          `;

          if (selectedItems[originalIndex]) {
            td.classList.add("selected");
          }

          td.addEventListener("click", () => {
            td.classList.toggle("selected");
            if (td.classList.contains("selected")) {
              selectedItems[originalIndex] = entry;
            } else {
              delete selectedItems[originalIndex];
            }
            localStorage.setItem(
              "selectedItems",
              JSON.stringify(selectedItems)
            );
            updateKnownCount();
          });

          row.appendChild(td);
        });

        updateKnownCount();
        updatePageDisplay();
      }

      renderTable();
      window.addEventListener("resize", renderTable);

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
          if (displayStartIndex >= filteredIndex.length) {
            displayStartIndex = Math.max(0, filteredIndex.length - 100);
          }
          renderTable();
          updatePageDisplay();
        });

      document.getElementById("showAllButton").addEventListener("click", () => {
        isHidingKnownWords = false;
        filteredIndex = [...Array(parsedData.length).keys()];
        selectedItems = JSON.parse(localStorage.getItem("selectedItems")) || {};
        displayStartIndex = Math.floor(displayStartIndex / 100) * 100;
        renderTable();
        updatePageDisplay();
      });

      document.getElementById("resetButton").addEventListener("click", () => {
        localStorage.removeItem("selectedItems");
        selectedItems = {};
        filteredIndex = [...Array(parsedData.length).keys()];
        displayStartIndex = 0;
        updateKnownCount();
        renderTable();
        updatePageDisplay();
      });

      document
        .getElementById("exportButton")
        .addEventListener("click", exportKnownWords);
      document
        .getElementById("exportNext20Button")
        .addEventListener("click", () => {
          exportNext20UnknownWords(parsedData);
        });

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
      document
        .getElementById("themeSelector")
        .addEventListener("change", (e) => {
          const selectedTheme = e.target.value;
          const themeLink = document.getElementById("themeStylesheet");
          themeLink.href = `theme-${selectedTheme}.css`;
        });
      // Load last used theme
      const savedTheme = localStorage.getItem("user-theme") || "cosmic";
      document.getElementById("themeSelector").value = savedTheme;
      document.getElementById(
        "themeStylesheet"
      ).href = `theme-${savedTheme}.css`;

      // Save theme on change
      document
        .getElementById("themeSelector")
        .addEventListener("change", (e) => {
          const selectedTheme = e.target.value;
          document.getElementById(
            "themeStylesheet"
          ).href = `themes/theme-${selectedTheme}.css`;
          localStorage.setItem("user-theme", selectedTheme);
        });
    });
});
