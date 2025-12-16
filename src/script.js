const audioPlayer = document.getElementById('audioPlayer');
const audioFile = document.getElementById('audioFile');
const lyricInput = document.getElementById('lyricInput');
const timeBadge = document.getElementById('timeBadge');
const capturedList = document.getElementById('capturedList');
const statusText = document.getElementById('statusText');
const toast = document.getElementById('toast');
const blindMode = document.getElementById('blindMode');
const inputContainer = document.getElementById('inputContainer');

let entries = [];
let lastCaptureTime = null;
let editingIndex = null;

// Auto-focus input
lyricInput.focus();

// Button event listeners
document.getElementById('btnJSON').addEventListener('click', copyJSON);
document.getElementById('btnLRC').addEventListener('click', exportLRC);
document.getElementById('btnSRT').addEventListener('click', exportSRT);
document.getElementById('btnUndo').addEventListener('click', undoLast);
document.getElementById('btnClear').addEventListener('click', safeClearAll);

// More menu dropdown
const btnClearToggle = document.getElementById('btnClearToggle');
const moreMenu = document.getElementById('moreMenu');

btnClearToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    moreMenu.style.display = moreMenu.style.display === 'none' ? 'block' : 'none';
});

document.addEventListener('click', () => {
    moreMenu.style.display = 'none';
});

// Drag and drop for audio file
const dropzone = document.querySelector('.dropzone');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
});

['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => {
        dropzone.classList.add('drag-over');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => {
        dropzone.classList.remove('drag-over');
    });
});

dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    audioFile.files = files;
    const event = new Event('change', { bubbles: true });
    audioFile.dispatchEvent(event);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Timestamp badge click handler - play/pause
timeBadge.addEventListener('click', (e) => {
    e.stopPropagation();
    if (audioPlayer.paused) {
        audioPlayer.play();
    } else {
        audioPlayer.pause();
    }
});

// Blind mode toggle
blindMode.addEventListener('change', (e) => {
    if (e.target.checked) {
        lyricInput.classList.add('blind-mode');
        lyricInput.placeholder = 'Press Enter to capture timing';
        showToast('🎯 Timing only mode enabled');
    } else {
        lyricInput.classList.remove('blind-mode');
        lyricInput.placeholder = 'Type lyric and press Enter...';
        showToast('🎯 Blind Mode OFF');
    }
    updateList();
    lyricInput.focus();
});

// Load audio file
audioFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audioPlayer.src = URL.createObjectURL(file);
        showToast('🎵 Audio loaded! Press play and start');
        lyricInput.focus();
    }
});

// Update time badge
audioPlayer.addEventListener('timeupdate', () => {
    const time = audioPlayer.currentTime.toFixed(1);
    timeBadge.textContent = time + 's';
});

// Keyboard controls
lyricInput.addEventListener('keydown', (e) => {
    // Space to play/pause ONLY if input is empty (before typing)
    if (e.code === 'Space' && lyricInput.value === '') {
        e.preventDefault();
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
        return;
    }
    // Enter to capture
    if (e.key === 'Enter' && lyricInput.value.trim()) {
        captureLyric();
    }
    // Escape to clear input
    if (e.key === 'Escape') {
        lyricInput.value = '';
    }
});

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Spacebar to play/pause (when not typing in input)
    if (e.code === 'Space' && document.activeElement !== lyricInput) {
        e.preventDefault();
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    }
    
    // Ctrl+Z to undo
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undoLast();
    }

    // Alt + arrow keys to nudge timing
    if (editingIndex !== null) {
        if (e.altKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            nudgeTiming(-0.1);
        }
        if (e.altKey && e.key === 'ArrowRight') {
            e.preventDefault();
            nudgeTiming(0.1);
        }
    }
});

function captureLyric() {
    let text = lyricInput.value.trim();
    
    if (editingIndex !== null) {
        // Update existing entry
        entries[editingIndex].text = text;
        showToast(`✎ Updated: "${text}"`);
        editingIndex = null;
    } else {
        // New entry
        if (!text) return;
        
        const time = parseFloat(audioPlayer.currentTime.toFixed(1));
        let deltaText = '';
        
        if (lastCaptureTime !== null) {
            const delta = (time - lastCaptureTime).toFixed(1);
            deltaText = ` (Δ ${delta}s)`;
        }
        
        entries.push({ time, text });
        lastCaptureTime = time;
        entries.sort((a, b) => a.time - b.time);
        
        // Trigger animation on timestamp badge
        timeBadge.classList.remove('captured');
        void timeBadge.offsetWidth; // Force reflow to restart animation
        timeBadge.classList.add('captured');
        
        // Flash input border
        lyricInput.classList.remove('capture-flash');
        void lyricInput.offsetWidth;
        lyricInput.classList.add('capture-flash');
        
        showToast(`✓ Captured @ ${time}s${deltaText}`);
    }
    
    lyricInput.value = '';
    lyricInput.focus();
    updateList();
    updateStatus();
}

function nudgeTiming(delta) {
    if (editingIndex === null) return;
    
    const newTime = parseFloat((entries[editingIndex].time + delta).toFixed(1));
    entries[editingIndex].time = newTime;
    entries.sort((a, b) => a.time - b.time);
    
    showToast(`⏱️ Time nudged to ${newTime}s`);
    updateList();
    updateStatus();
}

function updateList() {
    if (entries.length === 0) {
        capturedList.classList.add('empty');
        capturedList.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 1.1rem; font-weight: 500; margin-bottom: 20px;">Get started</div>
                <div style="display: flex; flex-direction: column; gap: 12px; font-size: 1rem; color: #6b7280;">
                    <div>Play the song</div>
                    <div>Type a lyric</div>
                    <div>Press Enter at the right moment</div>
                </div>
            </div>
        `;
        return;
    }

    capturedList.classList.remove('empty');

    if (blindMode.checked) {
        // Blind Mode: Show only timestamps
        capturedList.innerHTML = `
            <div class="blind-mode-indicator">Timing only mode enabled</div>
            ${entries.map((entry, i) => `
                <div class="captured-item" style="padding: 12px 20px;">
                    <div class="item-number">${i + 1}</div>
                    <div class="item-time" style="cursor: pointer; font-weight: 600;" data-time="${entry.time}">${entry.time}s</div>
                    <div style="flex: 1; color: #d1d5db;">— timing captured</div>
                    <button class="delete-btn" style="padding: 4px 8px; font-size: 0.9rem; cursor: pointer; color: #9ca3af; border: none; background: none; border-radius: 4px; transition: all 0.2s;" data-delete="${i}">✕</button>
                </div>
            `).join('')}
        `;
    } else {
        // Normal Mode: Show lyrics
        capturedList.innerHTML = entries.map((entry, i) => `
            <div class="captured-item" style="${editingIndex === i ? 'background: #fef3c7;' : ''}">
                <div class="item-number">${i + 1}</div>
                <div class="item-time" style="cursor: pointer;" data-time="${entry.time}">${entry.time}s</div>
                <div class="item-text editable-text" style="cursor: pointer; flex: 1;" data-index="${i}">${escapeHtml(entry.text)}</div>
                <button class="delete-btn" style="padding: 4px 8px; font-size: 0.9rem; cursor: pointer; color: #9ca3af; border: none; background: none; border-radius: 4px; transition: all 0.2s;" data-delete="${i}" title="Delete line">✕</button>
            </div>
        `).join('');
    }
    
    // Attach event listeners after HTML is rendered
    document.querySelectorAll('.item-text').forEach(el => {
        el.addEventListener('click', (e) => {
            const index = parseInt(el.getAttribute('data-index'));
            startEdit(index);
        });
    });
    
    document.querySelectorAll('[data-time]').forEach(el => {
        el.addEventListener('click', (e) => {
            const time = parseFloat(el.getAttribute('data-time'));
            seekTo(time);
        });
    });
    
    document.querySelectorAll('[data-delete]').forEach(el => {
        el.addEventListener('click', (e) => {
            const index = parseInt(el.getAttribute('data-delete'));
            deleteEntry(index);
        });
    });
}

function startEdit(index) {
    if (editingIndex !== null && editingIndex !== index) {
        // Cancel previous edit
        updateList();
    }
    
    editingIndex = index;
    lyricInput.value = entries[index].text;
    lyricInput.focus();
    lyricInput.classList.add('inline-edit');
    showToast('✎ Edit mode: Update and press Enter. Alt+←/→ to nudge time.');
    updateList();
}

function deleteEntry(index) {
    if (confirm(`Delete "${entries[index].text}"?`)) {
        entries.splice(index, 1);
        updateList();
        updateStatus();
        showToast('🗑️ Entry deleted');
    }
}

function updateStatus() {
    statusText.innerHTML = `Lines captured: <strong>${entries.length}</strong>`;
}

function seekTo(time) {
    audioPlayer.currentTime = time;
    audioPlayer.play();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyJSON() {
    if (entries.length === 0) {
        showToast('⚠️ No lyrics to copy', 'warning');
        return;
    }

    const json = JSON.stringify(entries, null, 2);
    navigator.clipboard.writeText(json).then(() => {
        showToast('✅ JSON copied to clipboard');
    });
}

function exportLRC() {
    if (entries.length === 0) {
        showToast('⚠️ No lyrics to export', 'warning');
        return;
    }

    let lrc = '[ti:Song Title]\n[ar:Artist Name]\n\n';
    entries.forEach(entry => {
        const minutes = Math.floor(entry.time / 60);
        const seconds = (entry.time % 60).toFixed(2);
        lrc += `[${minutes}:${seconds.padStart(5, '0')}]${entry.text}\n`;
    });

    navigator.clipboard.writeText(lrc).then(() => {
        showToast('✅ LRC format copied');
    });
}

function exportSRT() {
    if (entries.length === 0) {
        showToast('⚠️ No lyrics to export', 'warning');
        return;
    }

    let srt = '';
    entries.forEach((entry, i) => {
        const startTime = formatSrtTime(entry.time);
        const endTime = formatSrtTime(entries[i + 1]?.time || entry.time + 3);
        srt += `${i + 1}\n${startTime} --> ${endTime}\n${entry.text}\n\n`;
    });

    navigator.clipboard.writeText(srt).then(() => {
        showToast('✅ SRT format copied');
    });
}

function formatSrtTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function undoLast() {
    if (entries.length === 0) {
        showToast('⚠️ Nothing to undo', 'warning');
        return;
    }

    const removed = entries.pop();
    updateList();
    updateStatus();
    showToast(`↶ Removed: "${removed.text}"`);
    editingIndex = null;
    lyricInput.focus();
}

function clearAll() {
    if (entries.length === 0) return;
    
    if (confirm(`Clear all ${entries.length} lyrics? This cannot be undone.`)) {
        entries = [];
        lastCaptureTime = null;
        editingIndex = null;
        updateList();
        updateStatus();
        showToast('🗑️ All lyrics cleared');
        lyricInput.focus();
    }
}

function safeClearAll() {
    clearAll();
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = 'toast show';
    if (type === 'warning') {
        toast.style.background = '#f59e0b';
    } else {
        toast.style.background = '#10b981';
    }
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Keep input focused when not in edit mode (desktop only)
if (window.innerWidth > 768) {
    setInterval(() => {
        if (
            document.activeElement !== lyricInput &&
            document.activeElement.tagName !== 'INPUT' &&
            editingIndex === null
        ) {
            lyricInput.focus();
        }
    }, 150);
}
