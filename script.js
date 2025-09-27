async function getRandomWord() {
  const apis = [
    // List of APIs to get random words from
    "https://random-word-api.herokuapp.com/word",
    "https://random-words-api.vercel.app/word",
    "https://random-word.ryanrk.com/api/en/word",
  ];

  for (let api of apis) {
    try {
      const res = await fetch(api);
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      if (api.includes("herokuapp")) return data[0];
      if (api.includes("vercel")) return data[0]?.word;
      if (api.includes("ryanrk")) return data.word || data[0];
    } catch (e) {
      continue;
    }
  }
  return "hello";
}

async function fetchEntry(word) {
  try {
    const res = await fetch(
      // Get info about a word
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
    );
    if (!res.ok) throw new Error("Word not found");
    const data = await res.json();
    return data[0];
  } catch {
    return null;
  }
}

async function loadWord() {
  showLoader();
  const params = new URLSearchParams(window.location.search);
  const queryWord = params.get("word");
  let entry;

  if (queryWord) {
    entry = await fetchEntry(queryWord);
    hideLoader();
    if (!entry) {
      document.querySelector(".word span").textContent = queryWord;
      document.querySelector(".phonetic span").textContent =
        "- word not found -";
      document.querySelector(".meanings").innerHTML =
        `<div class="error" style="text-align: center;">Try searching for another word.</div>`;
      document.querySelector(".speak").style.display = "none";
      return;
    }
  } else {
    while (!entry) {
      const word = await getRandomWord();
      entry = await fetchEntry(word);
    }
    hideLoader();
  }

  updateWord(entry);
  setupSpeech(entry);
  renderMeanings(entry.meanings);
}

function updateWord(entry) {
  document.querySelector(".word span").textContent = entry.word;
  const phonetic = entry.phonetics.find((p) => p.text) || {};
  document.querySelector(".phonetic span").textContent =
    phonetic.text || entry.phonetic || "- phonetic unavailable -";
}

function setupSpeech(entry) {
  const speakBtn = document.querySelector(".speak");
  const img = speakBtn.querySelector("img");
  const textDiv = speakBtn.querySelector("div");
  const audioSrc = entry.phonetics.find((p) => p.audio)?.audio || "";

  const resetButton = () => {
    img.src = "./speak.svg";
    textDiv.textContent = "Speak";
  };

  if (audioSrc) {
    speakBtn.onclick = () => {
      img.src = "./ear.svg";
      textDiv.textContent = "Speaking...";
      const audio = new Audio(audioSrc);
      audio.play();
      audio.onended = resetButton;
    };
  } else if ("speechSynthesis" in window) {
    speakBtn.onclick = () => {
      img.src = "./ear.svg";
      textDiv.textContent = "Speaking...";
      const utterance = new SpeechSynthesisUtterance(entry.word);
      utterance.lang = "en-US";
      utterance.onend = resetButton;
      speechSynthesis.speak(utterance);
    };
  } else {
    speakBtn.style.display = "none";
  }
}

function renderMeanings(meanings) {
  const container = document.querySelector(".meanings");
  container.innerHTML = meanings
    .map((m) => {
      const defs = m.definitions
        .map(
          (d, i) => `
            <div class="defexp_group">
                <div class="definition">
                    <span class="number">${i + 1}.</span>
                    <span class="content">${d.definition}</span>
                </div>
                ${d.example ? `<div class="example">"${d.example}"</div>` : ""}
            </div>
        `,
        )
        .join("");

      const syns = m.synonyms?.length
        ? `<div class="synonyms"><span class="title">Synonyms: </span><span class="content">${m.synonyms.join(", ")}</span></div>`
        : "";

      const ants = m.antonyms?.length
        ? `<div class="antonyms"><span class="title">Antonyms: </span><span class="content">${m.antonyms.join(", ")}</span></div>`
        : "";

      return `
            <div class="group">
                <div class="partofspeech">${m.partOfSpeech}</div>
                ${defs}
                ${syns}
                ${ants}
            </div>
        `;
    })
    .join("");
}

function showLoader() {
  document.querySelector(".loader").style.display = "block";
  document.querySelector("main").style.opacity = "0.3";
}

function hideLoader() {
  document.querySelector(".loader").style.display = "none";
  document.querySelector("main").style.opacity = "1";
}

loadWord();
