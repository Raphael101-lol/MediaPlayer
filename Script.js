// Initialize media player when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Initialize music player
    initMusicPlayer();
    
    // Initialize video player
    initVideoPlayer();
    
    // Set up keyboard shortcuts
    initKeyboardShortcuts();
  });

  // LOADING SCREEN
  window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loadingScreen');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      showSection('home');
    }, 2500);
  });
  
  // SECTION SWITCHER
  function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
      section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'flex';
    window.scrollTo(0, 0);
    
    // Pause media when switching sections
    if (sectionId !== 'music' && musicPlayer.audio && !musicPlayer.audio.paused) {
      musicPlayer.pauseTrack();
    }
  }
  
  // MUSIC PLAYER
  const musicPlayer = {
    currentTrackIndex: 0,
    tracks: [],
    audio: new Audio(),
    isPlaying: false,
    updateProgressInterval: null,
    
    init: function() {
      const musicInput = document.getElementById('musicInput');
      const musicList = document.getElementById('musicList');
      const albumCover = document.querySelector('.album-cover');
      const songTitle = document.getElementById('songTitle');
      const songArtist = document.getElementById('songArtist');
      const progressBarContainer = document.getElementById('progressBarContainer');
      const progressFill = document.getElementById('progressFill');
      const progressThumb = document.getElementById('progressThumb');
      const playPauseButton = document.getElementById('playPause');
      const prevButton = document.getElementById('prevTrack');
      const nextButton = document.getElementById('nextTrack');
      const currentTimeDisplay = document.getElementById('currentTime');
      const durationDisplay = document.getElementById('duration');

      musicInput.addEventListener('change', this.handleMusicUpload.bind(this));
      playPauseButton.addEventListener('click', this.togglePlayPause.bind(this));
      prevButton.addEventListener('click', this.playPreviousTrack.bind(this));
      nextButton.addEventListener('click', this.playNextTrack.bind(this));
      
      // Progress bar interaction
      progressBarContainer.addEventListener('click', (e) => {
        const rect = progressBarContainer.getBoundingClientRect();
        const clickPosition = e.clientX - rect.left;
        const percentage = (clickPosition / rect.width) * 100;
        this.seekTo(percentage);
      });
      
      progressBarContainer.addEventListener('mousemove', (e) => {
        if (this.isDragging) {
          const rect = progressBarContainer.getBoundingClientRect();
          let percentage = ((e.clientX - rect.left) / rect.width) * 100;
          percentage = Math.max(0, Math.min(100, percentage));
          this.updateProgressUI(percentage);
        }
      });
      
      progressBarContainer.addEventListener('mousedown', () => {
        this.isDragging = true;
      });
      
      document.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          this.seekTo(this.currentProgress);
        }
      });
      
      this.audio.addEventListener('ended', this.playNextTrack.bind(this));
      this.audio.addEventListener('loadedmetadata', this.updateDuration.bind(this));
      
      // Make buttons focusable
      playPauseButton.setAttribute('tabindex', '0');
      prevButton.setAttribute('tabindex', '0');
      nextButton.setAttribute('tabindex', '0');
    },
    
    handleMusicUpload: function(e) {
      this.tracks = Array.from(e.target.files);
      const musicList = document.getElementById('musicList');
      musicList.innerHTML = '';

      if (this.tracks.length > 0) {
        document.getElementById('musicPlayerContainer').style.display = 'flex';
      }

      this.tracks.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'music-list-item';
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `Play ${file.name}`);
        
        // Extract metadata from filename
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        let artist = "Unknown Artist";
        let title = fileName;
        
        if (fileName.includes(' - ')) {
          const parts = fileName.split(' - ');
          artist = parts[0];
          title = parts.slice(1).join(' - ');
        }
        
        item.innerHTML = `
          <div class="song-info">
            <strong>${title}</strong>
            <div class="artist">${artist}</div>
          </div>
        `;
        
        item.addEventListener('click', () => {
          this.loadTrack(index);
          this.playTrack();
        });
        
        // Add keyboard support
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            this.loadTrack(index);
            this.playTrack();
          }
        });
        
        musicList.appendChild(item);
      });

      if (this.tracks.length > 0) {
        this.loadTrack(0);
      }
    },
    
    loadTrack: function(index) {
      this.currentTrackIndex = index;
      const file = this.tracks[index];
      const objectUrl = URL.createObjectURL(file);
      this.audio.src = objectUrl;
      
      // Extract metadata from filename
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      let artist = "Unknown Artist";
      let title = fileName;
      
      if (fileName.includes(' - ')) {
        const parts = fileName.split(' - ');
        artist = parts[0];
        title = parts.slice(1).join(' - ');
      }
      
      document.getElementById('songTitle').textContent = title;
      document.getElementById('songArtist').textContent = artist;
      
      // Reset progress bar
      this.updateProgressUI(0);
      document.getElementById('currentTime').textContent = "0:00";
      
      // Update active track in list
      document.querySelectorAll('.music-list-item').forEach((item, i) => {
        if (i === index) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      
      // Try to extract album art (placeholder implementation)
      const albumCover = document.querySelector('.album-cover');
      const albumCoverImg = document.createElement('img');
      albumCoverImg.alt = `${title} album cover`;
      albumCoverImg.onerror = function() {
        albumCoverImg.remove();
      };
      albumCoverImg.src = 'https://via.placeholder.com/250x250?text=No+Cover';
      albumCover.innerHTML = '';
      albumCover.appendChild(albumCoverImg);
    },
    
    updateDuration: function() {
      document.getElementById('duration').textContent = this.formatTime(this.audio.duration);
    },
    
    formatTime: function(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    },
    
    playTrack: function() {
      this.audio.play()
        .then(() => {
          this.isPlaying = true;
          document.getElementById('playPause').innerHTML = '&#10073;&#10073;';
          
          // Start updating progress bar
          clearInterval(this.updateProgressInterval);
          this.updateProgressInterval = setInterval(this.updateProgress.bind(this), 1000);
        })
        .catch(error => {
          console.error('Playback failed:', error);
          alert('Playback failed. Please try another file.');
        });
    },
    
    pauseTrack: function() {
      this.audio.pause();
      this.isPlaying = false;
      document.getElementById('playPause').innerHTML = '&#9654;';
      clearInterval(this.updateProgressInterval);
    },
    
    togglePlayPause: function() {
      if (this.tracks.length === 0) return;
      this.isPlaying ? this.pauseTrack() : this.playTrack();
    },
    
    playNextTrack: function() {
      if (this.tracks.length === 0) return;
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
      this.loadTrack(this.currentTrackIndex);
      this.playTrack();
    },
    
    playPreviousTrack: function() {
      if (this.tracks.length === 0) return;
      this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
      this.loadTrack(this.currentTrackIndex);
      this.playTrack();
    },
    
    updateProgress: function() {
      if (this.audio.duration && !this.isDragging) {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.updateProgressUI(progress);
        document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
      }
    },
    
    updateProgressUI: function(percentage) {
      this.currentProgress = percentage;
      document.getElementById('progressFill').style.width = `${percentage}%`;
      document.getElementById('progressThumb').style.left = `${percentage}%`;
    },
    
    seekTo: function(percentage) {
      if (this.audio.duration) {
        const seekTime = (percentage / 100) * this.audio.duration;
        this.audio.currentTime = seekTime;
      }
    }
  };
  
  // VIDEO PLAYER
  const videoPlayer = {
    videos: [],
    recentlyPlayedVideos: [],
    
    init: function() {
      const videoInput = document.getElementById('videoInput');
      videoInput.addEventListener('change', this.handleVideoUpload.bind(this));
    },
    
    handleVideoUpload: function(e) {
      this.videos = Array.from(e.target.files);
      const videoSidebar = document.getElementById('videoSidebar');
      videoSidebar.innerHTML = '';

      if (this.videos.length > 0) {
        const uploadBtn = document.getElementById('videoUploadBtn');
        uploadBtn.textContent = 'Upload More Videos';
        
        // Remove placeholder if it exists
        const recentlyPlayedContainer = document.getElementById('recentlyPlayedContainer');
        if (recentlyPlayedContainer.children.length === 1 && 
            !recentlyPlayedContainer.children[0].querySelector('video')) {
          recentlyPlayedContainer.innerHTML = '';
        }
      }

      this.videos.forEach((file, index) => {
        const videoItem = document.createElement('div');
        videoItem.className = 'sidebar-video';
        videoItem.setAttribute('tabindex', '0');
        videoItem.setAttribute('role', 'button');
        videoItem.setAttribute('aria-label', `Play ${file.name}`);
        
        const vid = document.createElement('video');
        vid.src = URL.createObjectURL(file);
        vid.muted = true;
        vid.controls = false;
        vid.setAttribute('aria-hidden', 'true');
        
        const videoTitle = document.createElement('div');
        videoTitle.className = 'video-title';
        videoTitle.textContent = file.name.replace(/\.[^/.]+$/, "");
        
        videoItem.appendChild(vid);
        videoItem.appendChild(videoTitle);
        
        videoItem.addEventListener('click', () => {
          this.playVideo(file);
        });
        
        // Add keyboard support
        videoItem.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            this.playVideo(file);
          }
        });
        
        videoSidebar.appendChild(videoItem);
});
},
playVideo: function(file) {
  const mainVideoPlayer = document.getElementById('mainVideoPlayer');
  mainVideoPlayer.innerHTML = '';
  
  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  video.controls = true;
  video.autoplay = true;
  video.style.width = '100%';
  video.setAttribute('aria-label', `Playing ${file.name}`);
  mainVideoPlayer.appendChild(video);

  // Add to Recently Played (no duplicates)
  this.addToRecentlyPlayed(file);
},

addToRecentlyPlayed: function(file) {
  // Check if video already exists in recently played by comparing names
  const alreadyExists = this.recentlyPlayedVideos.some(v => v.name === file.name);
  
  if (!alreadyExists) {
    // Add to beginning of array
    this.recentlyPlayedVideos.unshift(file);
    
    // Keep only last 5 videos
    if (this.recentlyPlayedVideos.length > 5) {
      this.recentlyPlayedVideos.pop();
    }
    
    // Update UI
    this.updateRecentlyPlayedUI();
  }
},

updateRecentlyPlayedUI: function() {
  const recentlyPlayedContainer = document.getElementById('recentlyPlayedContainer');
  recentlyPlayedContainer.innerHTML = '';
  
  this.recentlyPlayedVideos.forEach(file => {
    const videoContainer = document.createElement('div');
    videoContainer.style.position = 'relative';
    videoContainer.style.cursor = 'pointer';
    videoContainer.setAttribute('tabindex', '0');
    videoContainer.setAttribute('role', 'button');
    videoContainer.setAttribute('aria-label', `Play ${file.name}`);
    
    const recentVideo = document.createElement('video');
    recentVideo.src = URL.createObjectURL(file);
    recentVideo.controls = false;
    recentVideo.style.width = '180px';
    recentVideo.style.height = '120px';
    recentVideo.style.objectFit = 'cover';
    recentVideo.setAttribute('aria-hidden', 'true');
    
    videoContainer.appendChild(recentVideo);
    
    videoContainer.addEventListener('click', () => {
      this.playVideo(file);
    });
    
    // Add keyboard support
    videoContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.playVideo(file);
      }
    });
    
    recentlyPlayedContainer.appendChild(videoContainer);
  });
}
};

// Initialize components
function initMusicPlayer() {
musicPlayer.init();
}

function initVideoPlayer() {
videoPlayer.init();
}

// KEYBOARD SHORTCUTS
function initKeyboardShortcuts() {
document.addEventListener('keydown', (e) => {
// Spacebar to play/pause music (only when music section is active)
if (e.code === 'Space' && document.getElementById('music').style.display === 'flex') {
e.preventDefault();
musicPlayer.togglePlayPause();
}
  // Left/Right arrow keys for navigation (only when music section is active)
  if (document.getElementById('music').style.display === 'flex') {
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      musicPlayer.playPreviousTrack();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      musicPlayer.playNextTrack();
    }
  }
});
}