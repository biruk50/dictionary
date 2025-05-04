let dictionary = [];

// Load dictionary
fetch("words_alpha.txt")
  .then((response) => response.text())
  .then((text) => {
    dictionary = text
      .split("\n")
      .map((word) => word.trim().toLowerCase())
      .sort();
  })
  .catch((error) => {
    console.error("Error loading dictionary:", error);
    document.getElementById("result").textContent = "Error loading dictionary";
  });

function binarySearch(words, target) {
  let left = 0;
  let right = words.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (words[mid] === target) return true;
    if (words[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return false;
}

let isLoading = false; // Track if a search is in progress

async function searchWord() {
  if (isLoading) return; // Prevent multiple simultaneous searches

  const word = document.getElementById("wordInput").value.trim().toLowerCase();
  const resultDiv = document.getElementById("result");
  const definitionDiv = document.getElementById("definition");

  resultDiv.textContent = "";
  definitionDiv.textContent = "";

  if (!word) {
    resultDiv.textContent = "Please enter a word";
    return;
  }

  // Check if the word is cached in localStorage
  const cachedDefinition = localStorage.getItem(word);
  if (cachedDefinition) {
    resultDiv.textContent = `Word found in cache!`;
    definitionDiv.innerHTML = cachedDefinition;
    return;
  }

  if (binarySearch(dictionary, word)) {
    resultDiv.textContent = `Word found! Looking up definition...`;

    isLoading = true; // Set loading state to true
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
      );
      if (!response.ok) throw new Error("Definition not found");

      const data = await response.json();
      const formattedDefinition = formatDefinition(data[0]);
      definitionDiv.innerHTML = formattedDefinition;

      // Cache the definition in localStorage
      localStorage.setItem(word, formattedDefinition);
    } catch (error) {
      definitionDiv.textContent = "Definition not available";
    } finally {
      isLoading = false; // Reset loading state
    }
  } else {
    resultDiv.textContent = "Word not found in dictionary";
  }
}

function formatDefinition(entry) {
  return `
        <h3>${entry.word}</h3>
        ${entry.phonetic ? `<p>Phonetic: ${entry.phonetic}</p>` : ""}
        ${
          entry.phonetics?.length
            ? `
            <p>Pronunciations:
                ${entry.phonetics
                  .map(
                    (p) => `
                    ${p.text ? p.text : ""}
                    ${
                      p.audio ? `<audio controls src="${p.audio}"></audio>` : ""
                    }
                `
                  )
                  .join("")}
            </p>`
            : ""
        }
        ${entry.meanings
          .map(
            (meaning) => `
            <div>
                <strong>${meaning.partOfSpeech}</strong>
                <ul>
                    ${meaning.definitions
                      .slice(0, 3)
                      .map(
                        (def) => `
                        <li>${def.definition}</li>
                        ${def.example ? `<em>Example: ${def.example}</em>` : ""}
                    `
                      )
                      .join("")}
                </ul>
            </div>
        `
          )
          .join("")}
    `;
}
