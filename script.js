console.log('Just rolling around');
let currentSong = new Audio();
let songs = [];
let currFolder = "";

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        let res = await fetch(`/${folder}/info.json`);
        let data = await res.json();
        songs = data.songs;

        const songUL = document.querySelector(".songList ul");
        songUL.innerHTML = "";

        for (const song of songs) {
            songUL.innerHTML += `
                <li>
                    <img class="invert" width="34" src="img/music.svg" alt="">
                    <div class="info">
                        <div>${song}</div>
                        <div>kaka</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="img/play.svg" alt="">
                    </div>
                </li>`;
        }

        // Attach click events to each song
        Array.from(songUL.getElementsByTagName("li")).forEach(li => {
            li.addEventListener("click", () => {
                const trackName = li.querySelector(".info div").innerText.trim();
                playMusic(trackName);
            });
        });

        return songs;
    } catch (err) {
        console.error("Failed to load songs for folder:", folder, err);
        return [];
    }
}

function playMusic(track, pause = false) {
    if (!track) return;
    const url = `/${currFolder}/${track}`;
    currentSong.src = url;
    if (!pause) {
        currentSong.play().then(() => {
            play.src = "img/pause.svg";
        }).catch(err => console.error("Playback failed:", err));
    }

    document.querySelector(".songinfo").innerText = decodeURI(track);
    document.querySelector(".songtime").innerText = "00:00 / 00:00";
}

async function displayAlbums() {
    const res = await fetch(`/songs/`);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const links = doc.querySelectorAll("a");
    const cardContainer = document.querySelector(".cardContainer");

    for (const link of links) {
        const href = link.getAttribute("href");
        if (href && href.startsWith("songs/") && !href.endsWith(".mp3") && !href.includes(".")) {
            const folder = href.split("/")[1];
            try {
                const metaRes = await fetch(`/songs/${folder}/info.json`);
                const metadata = await metaRes.json();
                cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${metadata.title}</h2>
                    <p>${metadata.description}</p>
                </div>`;
            } catch (err) {
                console.warn(`Skipping ${folder}:`, err);
            }
        }
    }

    // Attach click listeners to album cards
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            const folder = card.getAttribute("data-folder");
            songs = await getSongs(`songs/${folder}`);
            playMusic(songs[0]);
        });
    });
}

async function main() {
    await getSongs("songs/English");
    playMusic(songs[0], true);
    await displayAlbums();

    // Play/Pause toggle
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    // Time update
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerText = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
    });

    // Seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        currentSong.currentTime = (currentSong.duration * percent) / 100;
        document.querySelector(".circle").style.left = `${percent}%`;
    });

    // Hamburger menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous button
    previous.addEventListener("click", () => {
        const current = decodeURI(currentSong.src.split("/").pop());
        const index = songs.findIndex(song => song === current);
        if (index > 0) playMusic(songs[index - 1]);
    });

    // Next button
    next.addEventListener("click", () => {
        const current = decodeURI(currentSong.src.split("/").pop());
        const index = songs.findIndex(song => song === current);
        if (index >= 0 && index < songs.length - 1) playMusic(songs[index + 1]);
    });

    // Volume
    const volumeInput = document.querySelector(".range input");
    volumeInput.addEventListener("input", (e) => {
        const volume = parseInt(e.target.value) / 100;
        currentSong.volume = volume;
        const img = document.querySelector(".volume>img");
        if (volume > 0) img.src = img.src.replace("mute.svg", "volume.svg");
    });

    // Mute toggle
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            volumeInput.value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.1;
            volumeInput.value = 10;
        }
    });
}

main();
