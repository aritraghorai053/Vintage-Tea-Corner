const playBtn            = document.getElementById("playBtn");
const prevBtn            = document.getElementById("prevBtn");
const nextBtn            = document.getElementById("nextBtn");
const heroPlayBtn        = document.getElementById("heroPlayBtn");
const volBtn             = document.getElementById("volBtn");
const volRange           = document.getElementById("volRange");
const trackName          = document.getElementById("trackName");
const trackArtist        = document.getElementById("trackArtist");
const albumArt           = document.getElementById("albumArt");
const visualizer         = document.getElementById("visualizer");
const progressContainer  = document.getElementById("progressContainer");
const progress           = document.getElementById("progress");
const currentTimeDisplay = document.getElementById("currentTimeDisplay");
const durationTimeDisplay = document.getElementById("durationTimeDisplay");
const youtubeUrlForm     = document.getElementById("youtubeUrlForm");
const youtubeUrlInput    = document.getElementById("youtubeUrlInput");
const menuBtn            = document.querySelector("#menuBtn");
const navLinks           = document.querySelector(".nav-links");

if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => navLinks.classList.toggle("active"));
    document.querySelectorAll(".nav-links a").forEach(a =>
        a.addEventListener("click", () => navLinks.classList.remove("active"))
    );
}

let player      = null;
let playerReady = false;
let progressTimer = null;

const DEFAULT_PLAYLIST = "PLCQUaoWwMr993_laX5MUp5fc-TUHl8hNH";

window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player("youtubePlayer", {
        width: "1", height: "1",
        playerVars: { autoplay: 0, controls: 0, playsinline: 1, rel: 0, modestbranding: 1, fs: 0 },
        events: {
            onReady:       onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError:       onPlayerError
        }
    });
};

function onPlayerReady() {
    playerReady = true;
    player.setVolume(Number(volRange.value));
    player.loadPlaylist({ listType: "playlist", list: DEFAULT_PLAYLIST, index: 0 });
    setTimeout(() => { player.pauseVideo(); updateSongInfo(); }, 1500);
}

function onPlayerStateChange(event) {
    const s = event.data;
    if (s === YT.PlayerState.PLAYING) {
        setPlayingUI(true);
        startProgress();
        updateSongInfo();
    } else if (s === YT.PlayerState.PAUSED || s === YT.PlayerState.ENDED) {
        setPlayingUI(false);
        stopProgress();
    }
}

function onPlayerError(event) {
    if (event.data === 150 || event.data === 101) player.nextVideo();
}

function setPlayingUI(playing) {
    if (playing) {
        playBtn.innerHTML = "❚❚";
        albumArt.classList.add("playing");
        visualizer.classList.add("active");
    } else {
        playBtn.innerHTML = "▶";
        albumArt.classList.remove("playing");
        visualizer.classList.remove("active");
    }
}

function updateSongInfo() {
    if (!playerReady) return;
    const data = player.getVideoData();
    if (data && data.title) {
        setTrackName(data.title);
        trackArtist.innerText = data.author || "YouTube Playlist";
    }
}

function setTrackName(title) {
    trackName.innerText = title;
    trackName.classList.remove("scrolling");
    void trackName.offsetWidth;

    const wrapper = trackName.closest(".marquee-wrapper");
    if (!wrapper) return;

    if (trackName.scrollWidth > wrapper.clientWidth) {
        trackName.innerText = title + "   —   " + title;
        trackName.classList.add("scrolling");
    }
}

function startProgress() {
    stopProgress();
    progressTimer = setInterval(() => {
        if (!playerReady) return;
        const cur = player.getCurrentTime() || 0;
        const dur = player.getDuration()    || 0;
        if (dur > 0) {
            progress.style.width          = (cur / dur * 100) + "%";
            currentTimeDisplay.innerText  = fmt(cur);
            durationTimeDisplay.innerText = fmt(dur);
        }
    }, 500);
}

function stopProgress() {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
}

function fmt(sec) {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
}

progressContainer.addEventListener("click", (e) => {
    if (!playerReady) return;
    const rect  = progressContainer.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    player.seekTo(player.getDuration() * ratio, true);
});

playBtn.addEventListener("click", () => {
    if (!playerReady) { showToast("Player লোড হচ্ছে…"); return; }
    player.getPlayerState() === YT.PlayerState.PLAYING
        ? player.pauseVideo()
        : player.playVideo();
});

if (heroPlayBtn) {
    heroPlayBtn.addEventListener("click", () => {
        if (!playerReady) return;
        player.getPlayerState() === YT.PlayerState.PLAYING
            ? player.pauseVideo()
            : player.playVideo();
    });
}

nextBtn.addEventListener("click", () => { if (playerReady) player.nextVideo(); });
prevBtn.addEventListener("click", () => { if (playerReady) player.previousVideo(); });

volRange.addEventListener("input", function () {
    const vol = Number(this.value);
    if (playerReady) player.setVolume(vol);
    volBtn.innerHTML = vol === 0 ? "🔇" : vol < 50 ? "🔉" : "🔊";
});

volBtn.addEventListener("click", () => {
    if (!playerReady) return;
    if (player.isMuted()) {
        player.unMute();
        player.setVolume(Number(volRange.value));
        volBtn.innerHTML = "🔊";
    } else {
        player.mute();
        volBtn.innerHTML = "🔇";
    }
});

if (youtubeUrlForm) {
    youtubeUrlForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const raw = youtubeUrlInput.value.trim();
        if (!raw) return;

        let listId = null, videoId = null;
        try {
            const u = new URL(raw);
            listId  = u.searchParams.get("list");
            videoId = u.searchParams.get("v") ||
                      (u.hostname === "youtu.be" ? u.pathname.slice(1) : null);
        } catch { listId = raw; }

        if (!playerReady) { showToast("Player এখনো প্রস্তুত হচ্ছে…"); return; }

        if (listId) {
            player.loadPlaylist({ listType: "playlist", list: listId, index: 0 });
            showToast("✅ Playlist লোড হচ্ছে…");
        } else if (videoId) {
            player.loadVideoById(videoId);
            showToast("✅ Video লোড হচ্ছে…");
        } else {
            showToast("❌ সঠিক YouTube URL দিন");
            return;
        }
        youtubeUrlInput.value = "";
    });
}

function showToast(msg) {
    let toast = document.getElementById("toastNotification");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toastNotification";
        toast.className = "toast-notification";
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
}