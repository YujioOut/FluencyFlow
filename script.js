document.addEventListener("DOMContentLoaded", () => {
  let selectedItems = JSON.parse(localStorage.getItem("selectedItems")) || {}; // ✅ Stores selected words
  let isHidingKnownWords = false;
  let showRomaji = true;
  let showKana = true;
  let showEnglish = true;
  let filteredIndex = []; // ✅ List of all words that have NOT been hidden
  let displayStartIndex = 0; // ✅ The starting index in filteredIndex

  const tableHeader = document.getElementById("table-header");

  function updateTableHeader() {
    let isMobile = window.innerWidth < 768;
    let headers = isMobile
      ? ["一", "二", "三", "四"]
      : ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

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
    if (filteredIndex.length === 0) return; // Prevent errors if all words are hidden

    let firstWordIndex = filteredIndex[displayStartIndex]; // ✅ Get the original CSV index of the first word
    let pageNumber = firstWordIndex / 100 + 1; // ✅ Convert to page format

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

    // ✅ Copy to clipboard
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

  window.addEventListener("resize", updateTableHeader);
  updateTableHeader(); // ✅ Run on load

  fetch("vocab_list.csv")
    .then((response) => response.text())
    .then((csvText) => {
      const parsedData = Papa.parse(csvText, { header: true }).data;

      // ✅ Initialize filteredIndex to contain all words at the start
      filteredIndex = [...Array(parsedData.length).keys()];

      function renderTable() {
        const tableBody = document.querySelector("#vocabTable tbody");
        tableBody.innerHTML = "";

        let columns = window.innerWidth < 768 ? 4 : 10;

        // ✅ Use the filtered index to get words
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

          // ✅ Keep selected words green across pages
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

        updateKnownCount(); // 🔥 Update count when table renders
        updatePageDisplay(); // 🔥 Update page number
      }

      renderTable();
      window.addEventListener("resize", renderTable);

      // ✅ "Next" Button - Moves forward by exactly 100 words in filteredIndex
      document.getElementById("nextButton").addEventListener("click", () => {
        if (displayStartIndex + 100 < filteredIndex.length) {
          displayStartIndex += 100;
          renderTable();
        }
      });

      // ✅ "Previous" Button - Moves back by exactly 100 words in filteredIndex
      document.getElementById("prevButton").addEventListener("click", () => {
        if (displayStartIndex - 100 >= 0) {
          displayStartIndex -= 100;
          renderTable();
        }
      });

      // ✅ "Hide Known Words" - Removes selected words from filteredIndex BUT KEEPS THEM IN `selectedItems`
      document
        .getElementById("hideKnownButton")
        .addEventListener("click", () => {
          isHidingKnownWords = true;

          // ✅ Remove all selected words from filteredIndex BUT DO NOT DELETE FROM `selectedItems`
          filteredIndex = filteredIndex.filter(
            (index) => !selectedItems[index]
          );

          // ✅ Ensure the displayStartIndex is valid after removal
          if (displayStartIndex >= filteredIndex.length) {
            displayStartIndex = Math.max(0, filteredIndex.length - 100);
          }

          renderTable();
          updatePageDisplay(); // ✅ Fix stuck page display
        });

      // ✅ "Show All Words" - Resets filteredIndex to include all words again & restores green words
      document.getElementById("showAllButton").addEventListener("click", () => {
        isHidingKnownWords = false;

        // ✅ Reset filteredIndex to ALL words
        filteredIndex = [...Array(parsedData.length).keys()];

        // ✅ Ensure selected words remain green
        selectedItems = JSON.parse(localStorage.getItem("selectedItems")) || {};

        // ✅ Reset displayStartIndex to the nearest multiple of 100
        displayStartIndex = Math.floor(displayStartIndex / 100) * 100;

        renderTable();
        updatePageDisplay(); // ✅ Fix page not updating after showing all
      });

      document.getElementById("resetButton").addEventListener("click", () => {
        localStorage.removeItem("selectedItems");
        selectedItems = {};
        filteredIndex = [...Array(parsedData.length).keys()]; // ✅ Reset to all words
        displayStartIndex = 0; // ✅ Reset to start
        updateKnownCount(); // 🔥 Reset counter to 0
        renderTable();
        updatePageDisplay(); // ✅ Fix page stuck on reset
      });

      // ✅ Export Known Words Button
      document
        .getElementById("exportButton")
        .addEventListener("click", exportKnownWords);

      // ✅ Toggle Display Buttons
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
    });
});
