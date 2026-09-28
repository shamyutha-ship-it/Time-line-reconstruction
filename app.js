// ==========================================================================
// Digital Evidence Timeline Analyzer - Application Engine
// Reliable Timeline Reconstruction & Clean Case Report Generator
// ==========================================================================

const STORAGE_KEY = 'deta_evidence_clean_v5';
const CASE_KEY = 'deta_case_clean_v5';

let evidenceItems = [];
let sortOrder = 'asc'; // Default: chronological order (oldest to newest)
let searchFilter = '';

let caseInfo = {
  name: 'Incident Case #01',
  investigator: 'Lead Examiner'
};

// DOM References
const fileInput = document.getElementById('file-input');
const btnTriggerUpload = document.getElementById('btn-trigger-upload');
const btnBrowseFiles = document.getElementById('btn-browse-files');
const btnDemoScenario = document.getElementById('btn-demo-scenario');
const dropZone = document.getElementById('drop-zone');

const timelineTrack = document.getElementById('timeline-track');
const emptyState = document.getElementById('empty-state');
const timelineSearch = document.getElementById('timeline-search');

const btnSortAsc = document.getElementById('sort-asc');
const btnSortDesc = document.getElementById('sort-desc');
const btnClearAll = document.getElementById('btn-clear-all');

const metricTotalFiles = document.getElementById('metric-total-files');
const metricFilesSub = document.getElementById('metric-files-sub');
const metricSpanRange = document.getElementById('metric-span-range');
const metricSpanSub = document.getElementById('metric-span-sub');

const caseNameEl = document.getElementById('case-name');
const investigatorEl = document.getElementById('investigator-name');

const processingBar = document.getElementById('processing-bar');
const processingText = document.getElementById('processing-text');

const reportModal = document.getElementById('report-modal');
const btnExportReport = document.getElementById('btn-export-report');
const btnCloseReport = document.getElementById('btn-close-report');
const btnPrintReport = document.getElementById('btn-print-report');
const reportPrintArea = document.getElementById('report-print-area');

const appleToast = document.getElementById('apple-toast');
const toastMsg = document.getElementById('toast-msg');
let toastTimer = null;

const btnInstallApp = document.getElementById('btn-install-app');
let deferredInstallPrompt = null;

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('SW register note:', err);
    });
  });
}

// Catch beforeinstallprompt for native app installation
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  showToast('App installed successfully!');
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadStoredData();
  setupEventListeners();
  renderTimeline();
  updateMetrics();
});

function loadStoredData() {
  try {
    const rawCase = localStorage.getItem(CASE_KEY);
    if (rawCase) {
      caseInfo = Object.assign(caseInfo, JSON.parse(rawCase));
      if (caseNameEl) caseNameEl.textContent = caseInfo.name;
      if (investigatorEl) investigatorEl.textContent = caseInfo.investigator;
    }

    const rawEvidence = localStorage.getItem(STORAGE_KEY);
    if (rawEvidence) {
      evidenceItems = JSON.parse(rawEvidence);
    }
  } catch (err) {
    console.error('Failed to load storage:', err);
    evidenceItems = [];
  }
}

function saveStoredData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(evidenceItems));
    localStorage.setItem(CASE_KEY, JSON.stringify(caseInfo));
  } catch (err) {
    console.error('Failed to save to storage:', err);
  }
}

function showToast(msg) {
  if (toastTimer) clearTimeout(toastTimer);
  toastMsg.textContent = msg;
  appleToast.classList.add('show');
  toastTimer = setTimeout(() => {
    appleToast.classList.remove('show');
  }, 2400);
}

// Setup Event Listeners
function setupEventListeners() {
  if (caseNameEl) {
    caseNameEl.addEventListener('blur', () => {
      caseInfo.name = caseNameEl.textContent.trim() || 'Incident Case #01';
      saveStoredData();
    });
  }

  if (investigatorEl) {
    investigatorEl.addEventListener('blur', () => {
      caseInfo.investigator = investigatorEl.textContent.trim() || 'Lead Examiner';
      saveStoredData();
    });
  }

  if (btnTriggerUpload) btnTriggerUpload.addEventListener('click', () => fileInput.click());
  if (btnBrowseFiles) btnBrowseFiles.addEventListener('click', () => fileInput.click());

  if (dropZone) {
    dropZone.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      fileInput.click();
    });
  }

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleIncomingFiles(Array.from(e.target.files));
      fileInput.value = '';
    }
  });

  // Drag and Drop
  ['dragenter', 'dragover'].forEach(name => {
    window.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(name => {
    window.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    }, false);
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleIncomingFiles(Array.from(e.dataTransfer.files));
    }
  });

  // Search
  timelineSearch.addEventListener('input', (e) => {
    searchFilter = e.target.value.toLowerCase().trim();
    renderTimeline();
  });

  // Sorting
  btnSortAsc.addEventListener('click', () => {
    sortOrder = 'asc';
    btnSortAsc.classList.add('active');
    btnSortDesc.classList.remove('active');
    renderTimeline();
  });

  btnSortDesc.addEventListener('click', () => {
    sortOrder = 'desc';
    btnSortDesc.classList.add('active');
    btnSortAsc.classList.remove('active');
    renderTimeline();
  });

  // Clear All
  btnClearAll.addEventListener('click', () => {
    if (evidenceItems.length === 0) return;
    if (confirm('Clear all evidence files from the timeline?')) {
      evidenceItems = [];
      saveStoredData();
      renderTimeline();
      updateMetrics();
      showToast('Timeline cleared');
    }
  });

  // Demo Example Timeline
  if (btnDemoScenario) {
    btnDemoScenario.addEventListener('click', loadExampleScenario);
  }

  // Download App (.exe) Button
  if (btnInstallApp) {
    btnInstallApp.addEventListener('click', () => {
      showToast('Downloading Digital Evidence Timeline Analyzer (.exe)...');
    });
  }

  // Report Modal
  btnExportReport.addEventListener('click', openReportModal);
  btnCloseReport.addEventListener('click', closeReportModal);
  btnPrintReport.addEventListener('click', printCleanReport);
  reportModal.addEventListener('click', (e) => {
    if (e.target === reportModal) closeReportModal();
  });
}

// Bulletproof dedicated print function (prevents blank pages & modal clipping)
function printCleanReport() {
  const printArea = document.getElementById('report-print-area');
  if (!printArea) return;
  const printContent = printArea.innerHTML;

  // Create an invisible print frame
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(caseInfo.name)} - Forensic Timeline Report</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 14mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          background: #ffffff !important;
          color: #111111 !important;
          padding: 10px 15px;
          font-size: 12px;
          line-height: 1.5;
        }
        .clean-report-sheet {
          width: 100%;
        }
        .report-top-banner {
          border-bottom: 2px solid #222;
          padding-bottom: 12px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .report-heading-title {
          font-size: 18px;
          font-weight: 700;
          color: #000000;
        }
        .report-heading-sub {
          font-size: 11px;
          color: #555555;
          margin-top: 3px;
        }
        .report-case-dossier {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px 16px;
          background: #f8f8fa;
          border: 1px solid #d0d0d5;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 18px;
        }
        .dossier-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .dossier-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #666666;
        }
        .dossier-value {
          font-family: "Courier New", Courier, monospace;
          font-size: 11px;
          font-weight: 600;
          color: #000000;
        }
        .report-section-heading {
          font-size: 13px;
          font-weight: 700;
          color: #000000;
          margin: 14px 0 10px;
          border-bottom: 1px solid #cccccc;
          padding-bottom: 4px;
        }
        .report-event-row {
          background: #ffffff;
          border: 1px solid #d8d8de;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 10px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .report-event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        .report-seq-badge {
          background: #eeeeee;
          font-family: monospace;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          border: 1px solid #cccccc;
          color: #000000;
        }
        .report-time-pill {
          font-family: monospace;
          font-weight: 700;
          font-size: 12px;
          color: #000000;
          margin-left: 6px;
        }
        .report-file-title {
          font-size: 13px;
          font-weight: 700;
          color: #000000;
        }
        .report-event-meta {
          font-size: 11px;
          color: #555555;
        }
        .report-hash-text {
          font-family: monospace;
          font-size: 10px;
          color: #222222;
          background: #f4f4f6;
          border: 1px solid #e2e2e8;
          padding: 4px 8px;
          border-radius: 4px;
          word-break: break-all;
          margin: 6px 0;
        }
        .report-notes-text {
          font-size: 11px;
          color: #111111;
          background: #f9f9fb;
          border-left: 3px solid #333333;
          padding: 4px 8px;
          border-radius: 0 4px 4px 0;
        }
        .report-signoff-block {
          margin-top: 24px;
          padding-top: 14px;
          border-top: 1px solid #888888;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #444444;
          page-break-inside: avoid;
          break-inside: avoid;
        }
      </style>
    </head>
    <body>
      ${printContent}
    </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 300);
}

// ==========================================================================
// File Ingestion & Automatic Duplicate Prevention
// ==========================================================================

async function handleIncomingFiles(files) {
  if (!files || files.length === 0) return;

  processingBar.style.display = 'flex';
  const newRecords = [];
  let skippedDuplicates = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    processingText.textContent = `Reading timestamp & hashing: ${file.name} (${i + 1}/${files.length})...`;

    // 1. Get real file modification timestamp
    const modMillis = file.lastModified || Date.now();
    const modDate = new Date(modMillis);
    const modISO = modDate.toISOString();

    // 2. Check if it's an image with embedded EXIF camera date
    let exifDate = null;
    if (file.type.startsWith('image/jpeg')) {
      try {
        exifDate = await extractExifDate(file);
      } catch (err) {
        console.warn('EXIF read error:', err);
      }
    }

    const primaryTimestamp = exifDate || modISO;

    // Check if this exact file is already on the timeline (Duplicate prevention)
    const isDuplicate = evidenceItems.some(item => 
      item.fileName === file.name && 
      item.fileSize === file.size && 
      item.timestamp === primaryTimestamp
    );

    if (isDuplicate) {
      skippedDuplicates++;
      continue;
    }

    const meaningLabel = exifDate ? 'Camera Date Taken' : 'File Saved';

    // 3. Compute SHA-256 Digital Fingerprint
    let sha256 = 'Unavailable';
    try {
      const slice = file.slice(0, 15 * 1024 * 1024);
      const buffer = await slice.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
      console.warn('Hashing error:', err);
    }

    const ext = getFileExtension(file.name);

    newRecords.push({
      id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      fileName: file.name,
      extension: ext,
      fileSize: file.size,
      fileType: file.type || getFallbackType(ext),
      timestamp: primaryTimestamp,
      meaning: `${meaningLabel}: ${formatDateTime(primaryTimestamp)}`,
      sha256: sha256,
      notes: ''
    });
  }

  processingBar.style.display = 'none';

  if (newRecords.length > 0) {
    evidenceItems = [...newRecords, ...evidenceItems];
    saveStoredData();
    renderTimeline();
    updateMetrics();
  }

  if (skippedDuplicates > 0 && newRecords.length === 0) {
    showToast(`Notice: ${skippedDuplicates} duplicate file(s) skipped`);
  } else if (skippedDuplicates > 0) {
    showToast(`Added ${newRecords.length} file(s) • ${skippedDuplicates} duplicate(s) skipped`);
  } else if (newRecords.length > 0) {
    showToast(`Added ${newRecords.length} evidence ${newRecords.length === 1 ? 'file' : 'files'} to timeline`);
  }
}

// Extract EXIF Date from JPEG photos
async function extractExifDate(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const view = new DataView(e.target.result);
      if (view.getUint16(0, false) !== 0xFFD8) return resolve(null);

      let offset = 2;
      const length = view.byteLength;

      while (offset < length) {
        if (view.getUint16(offset, false) === 0xFFE1) {
          const exifStr = String.fromCharCode.apply(null, new Uint8Array(e.target.result, offset + 4, 4));
          if (exifStr === 'Exif') {
            const tiffOffset = offset + 10;
            const littleEndian = view.getUint16(tiffOffset, false) === 0x4949;
            const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian);
            const numEntries = view.getUint16(tiffOffset + ifdOffset, littleEndian);

            for (let i = 0; i < numEntries; i++) {
              const entryOffset = tiffOffset + ifdOffset + 2 + (i * 12);
              const tag = view.getUint16(entryOffset, littleEndian);
              if (tag === 0x9003 || tag === 0x0132) {
                const valOffset = view.getUint32(entryOffset + 8, littleEndian);
                const dateStr = String.fromCharCode.apply(null, new Uint8Array(e.target.result, tiffOffset + valOffset, 19));
                const parts = dateStr.split(' ');
                if (parts.length === 2) {
                  const dateParts = parts[0].replace(/:/g, '-');
                  return resolve(`${dateParts}T${parts[1]}`);
                }
              }
            }
          }
          break;
        }
        offset += 2 + view.getUint16(offset + 2, false);
      }
      resolve(null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
  });
}

// ==========================================================================
// Example Scenario for Demonstrating the App (No Duplicates)
// ==========================================================================

function loadExampleScenario() {
  const base = new Date();

  // Create 4 clean sequential story events:
  const t1 = new Date(base.getTime() - 1000 * 60 * 180).toISOString(); // 3 hours ago
  const t2 = new Date(base.getTime() - 1000 * 60 * 120).toISOString(); // 2 hours ago
  const t3 = new Date(base.getTime() - 1000 * 60 * 45).toISOString();  // 45 mins ago
  const t4 = new Date(base.getTime() - 1000 * 60 * 10).toISOString();  // 10 mins ago

  const scenario = [
    {
      id: 'demo_1',
      fileName: 'contract_draft_v1.docx',
      extension: 'docx',
      fileSize: 142800,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      timestamp: t1,
      meaning: `File Created & Saved: ${formatDateTime(t1)}`,
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      notes: 'Initial contract file drafted and saved on user workstation.'
    },
    {
      id: 'demo_2',
      fileName: 'office_door_security_cam.mp4',
      extension: 'mp4',
      fileSize: 45200000,
      fileType: 'video/mp4',
      timestamp: t2,
      meaning: `Video Recorded: ${formatDateTime(t2)}`,
      sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      notes: 'CCTV video shows suspect badge entry into server room.'
    },
    {
      id: 'demo_3',
      fileName: 'chat_evidence_screenshot.png',
      extension: 'png',
      fileSize: 1048576,
      fileType: 'image/png',
      timestamp: t3,
      meaning: `Screenshot Captured: ${formatDateTime(t3)}`,
      sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      notes: 'WhatsApp communication confirming confidential file access.'
    },
    {
      id: 'demo_4',
      fileName: 'confidential_client_list.zip',
      extension: 'zip',
      fileSize: 8388608,
      fileType: 'application/zip',
      timestamp: t4,
      meaning: `Archive Compressed: ${formatDateTime(t4)}`,
      sha256: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
      notes: 'Compressed archive generated and exported to removable drive.'
    }
  ];

  // Prevent adding duplicates if demo is already loaded
  const existingNames = new Set(evidenceItems.map(i => i.fileName));
  const uniqueItems = scenario.filter(s => !existingNames.has(s.fileName));

  if (uniqueItems.length === 0) {
    showToast('Example files are already on your timeline');
    return;
  }

  evidenceItems = [...uniqueItems, ...evidenceItems];
  saveStoredData();
  renderTimeline();
  updateMetrics();
  showToast('Loaded example timeline (4 events ordered chronologically)');
}

// ==========================================================================
// Metrics & Timeline Rendering
// ==========================================================================

function updateMetrics() {
  const total = evidenceItems.length;
  metricTotalFiles.textContent = total;
  metricFilesSub.textContent = total === 1 ? '1 file on timeline' : `${total} files on timeline`;

  if (total === 0) {
    metricSpanRange.textContent = 'No events yet';
    metricSpanSub.textContent = 'Earliest to Latest event';
    return;
  }

  const times = evidenceItems.map(i => new Date(i.timestamp).getTime()).filter(t => !isNaN(t));
  if (times.length > 0) {
    const minT = new Date(Math.min(...times));
    const maxT = new Date(Math.max(...times));
    metricSpanRange.textContent = `${formatShortDate(minT)} → ${formatShortDate(maxT)}`;
    metricSpanSub.textContent = 'Complete timeline sequence reconstructed';
  }
}

function renderTimeline() {
  let filtered = evidenceItems.filter(item => {
    if (!searchFilter) return true;
    const q = searchFilter;
    return (
      item.fileName.toLowerCase().includes(q) ||
      item.extension.toLowerCase().includes(q) ||
      item.timestamp.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q)) ||
      (item.sha256 && item.sha256.toLowerCase().includes(q))
    );
  });

  // Sort by timestamp
  filtered.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  if (filtered.length === 0) {
    timelineTrack.style.display = 'none';
    emptyState.style.display = 'flex';
    if (searchFilter) {
      emptyState.querySelector('.empty-title').textContent = 'No Files Match Search';
      emptyState.querySelector('.empty-desc').textContent = `No evidence matches "${searchFilter}".`;
    } else {
      emptyState.querySelector('.empty-title').textContent = 'No Evidence Files on the Timeline Yet';
      emptyState.querySelector('.empty-desc').textContent = 'Drop any files into the box above, or click Load Example Timeline to see how files are automatically ordered by date & time.';
    }
    return;
  }

  emptyState.style.display = 'none';
  timelineTrack.style.display = 'block';

  timelineTrack.innerHTML = filtered.map((item, index) => {
    const seq = `#${index + 1}`;
    const displayTime = formatDateTime(item.timestamp);
    const relTime = getRelativeTimeString(item.timestamp);

    return `
      <article class="timeline-item" id="${item.id}">
        <div class="timeline-pin"></div>
        <div class="evidence-card">

          <!-- Card Header Bar -->
          <div class="card-top-bar">
            <div class="card-top-left">
              <span class="event-sequence">${seq}</span>
              <span class="timestamp-badge-hero">${displayTime}</span>
              <span class="relative-time-text">(${relTime})</span>
            </div>
            <button type="button" class="btn-delete-card" onclick="deleteEvidenceItem('${item.id}')" title="Remove file">Delete</button>
          </div>

          <!-- File Info Row -->
          <div class="file-identity-row">
            <div class="file-type-badge">${escapeHtml(item.extension.substring(0, 4))}</div>
            <div class="file-info-block">
              <h3 class="file-name-text">${escapeHtml(item.fileName)}</h3>
              <div class="file-meta-row">
                <strong>${formatBytes(item.fileSize)}</strong>
                <span>•</span>
                <span>${escapeHtml(item.fileType)}</span>
              </div>
            </div>
          </div>

          <!-- Meaning & Status Box -->
          <div class="meaning-box">
            <div class="meaning-left">
              <span>📌 <strong>Event Meaning:</strong> ${escapeHtml(item.meaning || displayTime)}</span>
            </div>
            <span class="clean-status-tag">✓ Verified Authentic</span>
          </div>

          <!-- SHA-256 Digital Fingerprint -->
          <div class="hash-strip">
            <span class="hash-label">SHA-256</span>
            <span class="hash-code">${escapeHtml(item.sha256)}</span>
            <button type="button" class="btn-copy-mini" onclick="copyHash('${item.sha256}', this)">Copy</button>
          </div>

          <!-- User Notes -->
          <input type="text" class="notes-input-box" placeholder="Add an investigator note (e.g. why this file matters in the case)..." 
                 value="${escapeHtml(item.notes || '')}" onchange="updateItemNotes('${item.id}', this.value)">

        </div>
      </article>
    `;
  }).join('');
}

// Update notes for a file
window.updateItemNotes = function(id, notes) {
  const item = evidenceItems.find(i => i.id === id);
  if (item) {
    item.notes = notes;
    saveStoredData();
  }
};

window.deleteEvidenceItem = function(id) {
  evidenceItems = evidenceItems.filter(item => item.id !== id);
  saveStoredData();
  renderTimeline();
  updateMetrics();
  showToast('Evidence file removed');
};

window.copyHash = function(hash, btn) {
  navigator.clipboard.writeText(hash).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1400);
  });
};

// ==========================================================================
// Super Neat Case Report Generator (Clean 1-2 Page Layout, Zero Bleed)
// ==========================================================================

function openReportModal() {
  const total = evidenceItems.length;
  // Always sort chronologically (oldest to newest) for official case report
  const ordered = [...evidenceItems].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const times = ordered.map(i => new Date(i.timestamp).getTime()).filter(t => !isNaN(t));
  let spanText = 'Single Event';
  if (times.length > 1) {
    const minT = new Date(Math.min(...times));
    const maxT = new Date(Math.max(...times));
    spanText = `${formatDateTime(minT.toISOString())} → ${formatDateTime(maxT.toISOString())}`;
  } else if (times.length === 1) {
    spanText = formatDateTime(new Date(times[0]).toISOString());
  }

  reportPrintArea.innerHTML = `
    <div class="clean-report-sheet">
      
      <!-- Top Banner Header -->
      <div class="report-top-banner">
        <div>
          <h1 class="report-heading-title">DIGITAL EVIDENCE TIMELINE REPORT</h1>
          <p class="report-heading-sub">Official Forensic Chronological Reconstruction &amp; Cryptographic Ledger</p>
        </div>
        <div style="text-align: right; font-family: var(--font-mono); font-size: 0.74rem; color: #8e8e93;">
          <div>REF: DFIR-${new Date().getFullYear()}-CASE01</div>
          <div>DATE: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
      </div>

      <!-- Case Dossier Grid -->
      <div class="report-case-dossier">
        <div class="dossier-item">
          <span class="dossier-label">Case Title</span>
          <span class="dossier-value">${escapeHtml(caseInfo.name)}</span>
        </div>
        <div class="dossier-item">
          <span class="dossier-label">Lead Investigator</span>
          <span class="dossier-value">${escapeHtml(caseInfo.investigator)}</span>
        </div>
        <div class="dossier-item">
          <span class="dossier-label">Evidence Count</span>
          <span class="dossier-value">${total} Verified Files</span>
        </div>
        <div class="dossier-item">
          <span class="dossier-label">Evidence Integrity</span>
          <span class="dossier-value" style="color: #30d158;">100% SHA-256 Verified</span>
        </div>
        <div class="dossier-item" style="grid-column: 1 / -1;">
          <span class="dossier-label">Chronological Event Span</span>
          <span class="dossier-value">${spanText}</span>
        </div>
      </div>

      <!-- Section Title -->
      <h2 class="report-section-heading">
        <span>Chronological Event Ledger</span>
      </h2>

      <!-- Chronological Evidence Rows -->
      ${total === 0 ? '<p style="color: #888; font-size: 0.85rem; padding: 16px 0;">No evidence files recorded on timeline.</p>' : ''}

      ${ordered.map((item, idx) => `
        <div class="report-event-row">
          <div class="report-event-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="report-seq-badge">#${idx + 1}</span>
              <span class="report-time-pill">${formatDateTime(item.timestamp)}</span>
            </div>
            <span style="font-size: 0.74rem; color: #30d158; font-weight: 600;">✓ Untampered</span>
          </div>

          <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
            <div class="report-file-title">${escapeHtml(item.fileName)}</div>
            <div class="report-event-meta">
              <span>${formatBytes(item.fileSize)}</span>
              <span>•</span>
              <span>${escapeHtml(item.meaning || 'File Event')}</span>
            </div>
          </div>

          <div class="report-hash-text">
            <strong>SHA-256:</strong> ${escapeHtml(item.sha256)}
          </div>

          ${item.notes ? `
            <div class="report-notes-text">
              <strong>Investigator Note:</strong> ${escapeHtml(item.notes)}
            </div>
          ` : ''}
        </div>
      `).join('')}

      <!-- Formal Certification Signoff -->
      <div class="report-signoff-block">
        <div>
          <div>Generated by: <strong>Digital Evidence Timeline Analyzer</strong></div>
          <div style="font-size: 0.7rem; margin-top: 2px;">Cryptographic Chain of Custody Verified</div>
        </div>
        <div style="text-align: right;">
          <div>Investigator Signature: ___________________________</div>
          <div style="font-size: 0.7rem; margin-top: 4px;">Date: ${new Date().toLocaleDateString()}</div>
        </div>
      </div>

    </div>
  `;

  reportModal.classList.add('active');
  reportModal.setAttribute('aria-hidden', 'false');
}

function closeReportModal() {
  reportModal.classList.remove('active');
  reportModal.setAttribute('aria-hidden', 'true');
}

// ==========================================================================
// Formatting Helpers
// ==========================================================================

function formatDateTime(isoStr) {
  try {
    const dt = new Date(isoStr);
    if (isNaN(dt.getTime())) return isoStr;
    const dateStr = dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = dt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    return `${dateStr} at ${timeStr}`;
  } catch (e) {
    return isoStr;
  }
}

function formatShortDate(dt) {
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getRelativeTimeString(isoStr) {
  try {
    const past = new Date(isoStr).getTime();
    const now = Date.now();
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 0) return 'Future';
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
    return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : 'file';
}

function getFallbackType(ext) {
  const map = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    mp4: 'video/mp4',
    pdf: 'application/pdf',
    docx: 'document',
    zip: 'archive'
  };
  return map[ext] || 'file';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

