const m3uUrl = "https://raw.githubusercontent.com/MohammadKobirShah/KobirIPTV/refs/heads/main/KobirIPTV.m3u"; // Replace with your M3U URL

const gridContainer = document.querySelector('.grid-container');
const searchInput = document.getElementById('search-input');
const categorySelect = document.getElementById('category-select');
const playerModal = document.getElementById('player-modal');
const shakaPlayerElement = document.getElementById('shaka-player');
const closePlayerBtn = document.getElementById('close-player');

let allChannels = [];
let shakaPlayer = null;

// Initialize the Shaka Player
function initializeShakaPlayer() {
  if (shaka.Player.isBrowserSupported()) {
    shakaPlayer = new shaka.Player(shakaPlayerElement);

    // Event listener for Shaka Player errors
    shakaPlayer.addEventListener('error', (event) => {
      console.error('Shaka Player Error:', event.detail);
    });
  } else {
    alert('Shaka Player is not supported in this browser.');
  }
}

// Load channels on page load
window.onload = async function () {
  initializeShakaPlayer();
  await loadChannels();
  initSearchAndCategory();
};

// Parse and load M3U channels
async function loadChannels() {
  try {
    const response = await fetch(m3uUrl);
    const text = await response.text();
    allChannels = parseM3U(text);
    renderChannels(allChannels);
    populateCategories(allChannels);
  } catch (error) {
    console.error('Error loading M3U file:', error);
  }
}

// Parse M3U file
function parseM3U(m3uText) {
  const lines = m3uText.split('\n');
  const channels = [];
  let channel = {};

  lines.forEach((line) => {
    if (line.startsWith('#EXTINF')) {
      const nameMatch = line.match(/#EXTINF:.*?,(.*)/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);

      channel.name = nameMatch ? nameMatch[1] : 'Unknown';
      channel.group = groupMatch ? groupMatch[1] : 'Uncategorized';
      channel.logo = logoMatch ? logoMatch[1] : null;
    } else if (line.startsWith('http')) {
      channel.url = line;
      channels.push(channel);
      channel = {}; // Reset for the next channel
    }
  });

  return channels;
}

// Render channels
function renderChannels(channels) {
  gridContainer.innerHTML = '';

  channels.forEach((channel) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${channel.logo || 'https://via.placeholder.com/150?text=No+Logo'}" alt="${channel.name}" class="channel-logo">
      <p class="card-title">${channel.name}</p>
    `;
    card.addEventListener('click', () => playChannel(channel.url));
    gridContainer.appendChild(card);
  });
}

// Populate category dropdown
function populateCategories(channels) {
  const categories = new Set(channels.map((channel) => channel.group));
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// Play channel using Shaka Player
function playChannel(url) {
  if (!shakaPlayer) {
    alert('Shaka Player is not initialized.');
    return;
  }

  shakaPlayer.load(url).then(() => {
    console.log('Channel loaded successfully:', url);
    playerModal.style.display = 'flex';
  }).catch((error) => {
    console.error('Error loading channel:', error);
  });
}

// Close player
closePlayerBtn.addEventListener('click', () => {
  shakaPlayer.unload().then(() => {
    console.log('Player unloaded.');
    playerModal.style.display = 'none';
  }).catch((error) => {
    console.error('Error unloading player:', error);
  });
});

// Search and category filter
function initSearchAndCategory() {
  searchInput.addEventListener('input', () => {
    const searchText = searchInput.value.toLowerCase();
    const filteredChannels = allChannels.filter((channel) =>
      channel.name.toLowerCase().includes(searchText)
    );
    renderChannels(filteredChannels);
  });

  categorySelect.addEventListener('change', () => {
    const selectedCategory = categorySelect.value;
    const filteredChannels =
      selectedCategory === 'all'
        ? allChannels
        : allChannels.filter((channel) => channel.group === selectedCategory);
    renderChannels(filteredChannels);
  });
}
