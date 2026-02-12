// ZenWrite Lite v1.0 - Demo Version
// Copyright (c) 2026 Zxns Starr

// State Management untuk Demo
const state = {
    tabs: [
        {
            id: 1,
            title: 'Dokumen Demo',
            content: '',
            paperColor: 'white'
        }
    ],
    currentTab: 1,
    currentTheme: 'light',
    currentPaperColor: 'white',
    currentHighlightColor: 'yellow',
    searchResults: [],
    currentMatchIndex: -1,
    undoStacks: {},
    redoStacks: {},
    maxUndoSteps: 50, // Dibatasi untuk demo
    maxTabs: 2, // Maksimal 2 tab untuk demo
    isSidebarCollapsed: false,
    isMobile: window.innerWidth <= 768,
    demoWatermarkVisible: true
};

// DOM Elements
const elements = {
    editor: document.getElementById('editor'),
    editorArea: document.getElementById('editorArea'),
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebarMobileToggle: document.getElementById('sidebarMobileToggle'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    themeToggle: document.getElementById('themeToggle'),
    tabsContainer: document.getElementById('tabsContainer'),
    addTabBtn: document.getElementById('addTabBtn'),
    highlightBtn: document.getElementById('highlightBtn'),
    removeHighlightBtn: document.getElementById('removeHighlightBtn'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    searchResults: document.getElementById('searchResults'),
    searchNav: document.getElementById('searchNav'),
    prevMatch: document.getElementById('prevMatch'),
    nextMatch: document.getElementById('nextMatch'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText'),
    newFileBtn: document.getElementById('newFileBtn'),
    openFileBtn: document.getElementById('openFileBtn'),
    saveFileBtn: document.getElementById('saveFileBtn'),
    exportPdfBtn: document.getElementById('exportPdfBtn'),
    fontSelect: document.getElementById('fontSelect'),
    fontSizeSelect: document.getElementById('fontSizeSelect'),
    textColor: document.getElementById('textColor'),
    backgroundColor: document.getElementById('backgroundColor'),
    printBtn: document.getElementById('printBtn'),
    wordCountBtn: document.getElementById('wordCountBtn'),
    fileInput: document.getElementById('fileInput'),
    wordCount: document.getElementById('wordCount'),
    charCount: document.getElementById('charCount'),
    lineCount: document.getElementById('lineCount'),
    pageCount: document.getElementById('pageCount'),
    lineNumbers: document.getElementById('lineNumbers'),
    copyBtn: document.getElementById('copyBtn'),
    pasteBtn: document.getElementById('pasteBtn'),
    cutBtn: document.getElementById('cutBtn'),
    transparentBgBtn: document.getElementById('transparentBgBtn'),
    pasteArea: document.getElementById('pasteArea'),
    buyButton: document.getElementById('buyButton'),
    buyModal: document.getElementById('buyModal'),
    closeBuyModal: document.getElementById('closeBuyModal'),
    koFiButton: document.getElementById('koFiButton'),
    cancelBuyButton: document.getElementById('cancelBuyButton')
};

// Initialize
function init() {
    loadState();
    setupEventListeners();
    setupColorPickers();
    initUndoRedo();
    renderTabs();
    updateEditorContent();
    updateStats();
    initUndoRedoForTab(state.currentTab);
    updateUndoRedoButtons();
    updateLineNumbers();
    setupHighlightColors();
    setupCopyPaste();
    updateSidebarForMobile();
    
    // Setup interval untuk update stats
    setInterval(updateStats, 1000);
    
    // Focus editor
    setTimeout(() => {
        elements.editor.focus();
    }, 500);
    
    // Setup paper colors
    setupPaperColors();
    
    // Sembunyikan demo notification setelah 5 detik
    setTimeout(() => {
        const demoNotification = document.getElementById('demoNotification');
        if (demoNotification) {
            demoNotification.style.transition = 'opacity 0.5s';
            demoNotification.style.opacity = '0';
            setTimeout(() => {
                demoNotification.style.display = 'none';
            }, 500);
        }
    }, 5000);
    
    showNotification('ZenWrite Lite siap digunakan!', 'info');
}

// Load state dari localStorage
function loadState() {
    const savedState = localStorage.getItem('notepadDemoState');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        Object.assign(state, parsed);
    }

    // Apply theme
    document.body.className = `${state.currentTheme}-theme`;
    elements.themeToggle.innerHTML = state.currentTheme === 'light' ? 
        '<i class="fas fa-moon"></i>' : 
        '<i class="fas fa-sun"></i>';

    // Apply paper color
    applyPaperColor(state.currentPaperColor);
    
    // Update active paper color in sidebar
    updateActivePaperColor();
}

// Save state ke localStorage
function saveState() {
    localStorage.setItem('notepadDemoState', JSON.stringify(state));
}

// Event Listeners
function setupEventListeners() {
    // Editor input dengan debounce
    let typingTimer;
    elements.editor.addEventListener('input', function() {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            saveToUndoStack();
            updateStats();
        }, 1000);
    });
    
    // Undo/Redo buttons
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        undoBtn.addEventListener('click', undo);
    }
    
    if (redoBtn) {
        redoBtn.addEventListener('click', redo);
    }
    
    // Selection change untuk toolbar updates
    elements.editor.addEventListener('selectionchange', () => {
        setTimeout(updateToolbarState, 10);
    });
    
    // Remove Background Toggle
    elements.transparentBgBtn.addEventListener('click', removeBackgroundColor);
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Sidebar toggle
    elements.sidebarToggle.addEventListener('click', handleSidebarToggle);
    elements.sidebarMobileToggle.addEventListener('click', toggleSidebarMobile);
    elements.sidebarOverlay.addEventListener('click', hideSidebarMobile);
    
    // Tab management (dibatasi)
    elements.addTabBtn.addEventListener('click', addNewTab);
    
    // Editor events
    elements.editor.addEventListener('input', handleEditorInput);
    elements.editor.addEventListener('keydown', handleEditorKeydown);
    elements.editor.addEventListener('mouseup', updateToolbarState);
    elements.editor.addEventListener('paste', handlePaste);
    elements.editor.addEventListener('copy', handleCopy);
    elements.editor.addEventListener('cut', handleCut);
    
    // Highlight
    elements.highlightBtn.addEventListener('click', applyHighlight);
    elements.removeHighlightBtn.addEventListener('click', removeHighlight);
    
    // Search (tanpa replace)
    elements.searchBtn.addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keyup', e => {
        if (e.key === 'Enter') performSearch();
    });
    elements.prevMatch.addEventListener('click', navigateToPrevMatch);
    elements.nextMatch.addEventListener('click', navigateToNextMatch);
    
    // File operations (terbatas)
    elements.newFileBtn.addEventListener('click', createNewFile);
    elements.openFileBtn.addEventListener('click', () => elements.fileInput.click());
    elements.saveFileBtn.addEventListener('click', saveToFile);
    elements.fileInput.addEventListener('change', openFile);
    elements.printBtn.addEventListener('click', printDocument);
    elements.wordCountBtn.addEventListener('click', showWordCountModal);
    
    // Formatting
    elements.fontSelect.addEventListener('change', applyFont);
    elements.fontSizeSelect.addEventListener('change', applyFontSize);
    elements.textColor.addEventListener('change', applyTextColor);
    elements.backgroundColor.addEventListener('change', applyBackgroundColor);
    
    // Toolbar buttons
    document.querySelectorAll('[data-command]').forEach(btn => {
        btn.addEventListener('click', e => {
            execCommand(e.target.closest('[data-command]').dataset.command);
        });
    });
    
    // Copy/Paste/Cut buttons
    elements.copyBtn.addEventListener('click', handleCopyButton);
    elements.pasteBtn.addEventListener('click', handlePasteButton);
    elements.cutBtn.addEventListener('click', handleCutButton);
    
    // PDF Export disabled
    elements.exportPdfBtn.addEventListener('click', function() {
        showNotification('Export PDF hanya tersedia di versi lengkap', 'warning');
        showBuyModal();
    });
    
    // Buy button
    elements.buyButton.addEventListener('click', showBuyModal);
    elements.closeBuyModal.addEventListener('click', () => {
        elements.buyModal.classList.remove('show');
    });
    elements.koFiButton.addEventListener('click', () => {
        window.open('https://ko-fi.com/zxnsstarr', '_blank');
        elements.buyModal.classList.remove('show');
    });
    elements.cancelBuyButton.addEventListener('click', () => {
        elements.buyModal.classList.remove('show');
    });
    
    // Auto-save (dibatasi interval)
    setInterval(() => {
        saveCurrentTabContent();
        saveState();
    }, 60000); // Setiap 1 menit
    
    // Window resize
    window.addEventListener('resize', () => {
        updateSidebarForMobile();
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (state.isMobile && 
            !elements.sidebar.contains(e.target) && 
            !elements.sidebarMobileToggle.contains(e.target) &&
            elements.sidebar.classList.contains('show')) {
            hideSidebarMobile();
        }
    });
}

// Paper Color Functions
function setupPaperColors() {
    document.querySelectorAll('.paper-color:not(.disabled)').forEach(color => {
        color.addEventListener('click', () => {
            const paperColor = color.dataset.color;
            
            if (color.classList.contains('disabled')) {
                showNotification('Warna kertas ini hanya tersedia di versi lengkap', 'warning');
                showBuyModal();
                return;
            }
            
            const currentTab = getCurrentTab();
            if (currentTab) {
                currentTab.paperColor = paperColor;
            }
            
            applyPaperColor(paperColor);
            updateActivePaperColor();
            
            state.currentPaperColor = paperColor;
            saveState();
            showNotification(`Warna kertas diubah ke ${color.textContent.trim()}`);
        });
    });
}

function applyPaperColor(color) {
    const classesToRemove = [
        'paper-white', 'paper-natural', 'paper-sepia', 
        'paper-blue', 'paper-dark', 'paper-green'
    ];
    
    classesToRemove.forEach(cls => {
        elements.editorArea.classList.remove(cls);
    });
    
    elements.editorArea.classList.add(`paper-${color}`);
}

function updateActivePaperColor() {
    const currentTab = getCurrentTab();
    const currentColor = currentTab?.paperColor || 'white';
    
    document.querySelectorAll('.paper-color').forEach(color => {
        color.classList.toggle('active', color.dataset.color === currentColor);
    });
}

// Tab Functions (dibatasi)
function getCurrentTab() {
    return state.tabs.find(tab => tab.id === state.currentTab);
}

function renderTabs() {
    elements.tabsContainer.innerHTML = '';
    state.tabs.forEach(tab => {
        const tabElement = document.createElement('div');
        tabElement.className = `tab ${tab.id === state.currentTab ? 'active' : ''}`;
        tabElement.innerHTML = `
            <div class="tab-content">
                <i class="fas fa-file-alt"></i>
                <span>${tab.title}</span>
                <span class="tab-close" data-tab-id="${tab.id}">&times;</span>
            </div>
        `;
        
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close') && !e.target.closest('.tab-close')) {
                switchTab(tab.id);
            }
        });
        
        const closeBtn = tabElement.querySelector('.tab-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tab.id);
        });
        
        elements.tabsContainer.appendChild(tabElement);
    });
}

function addNewTab() {
    if (state.tabs.length >= state.maxTabs) {
        showNotification(`Versi demo maksimal ${state.maxTabs} tab`, 'warning');
        showBuyModal();
        return;
    }
    
    const newTabId = Date.now();
    state.tabs.push({
        id: newTabId,
        title: `Dokumen ${state.tabs.length + 1}`,
        content: '',
        paperColor: 'white'
    });
    switchTab(newTabId);
}

function switchTab(tabId) {
    saveCurrentTabContent();
    state.currentTab = tabId;
    updateEditorContent();
    renderTabs();
    updateStats();
    updateLineNumbers();
    updateUndoRedoButtons();
    
    const currentTab = getCurrentTab();
    if (currentTab && currentTab.paperColor) {
        applyPaperColor(currentTab.paperColor);
        updateActivePaperColor();
    }
    
    elements.editor.focus();
}

function closeTab(tabId) {
    if (state.tabs.length <= 1) {
        showNotification('Tidak dapat menutup semua tab', 'warning');
        return;
    }
    
    state.tabs = state.tabs.filter(t => t.id !== tabId);
    if (tabId === state.currentTab) {
        state.currentTab = state.tabs[0].id;
    }
    
    renderTabs();
    updateEditorContent();
    
    const currentTab = getCurrentTab();
    if (currentTab && currentTab.paperColor) {
        applyPaperColor(currentTab.paperColor);
        updateActivePaperColor();
    }
}

// Editor Functions
function handleEditorInput() {
    const currentTab = getCurrentTab();
    if (!currentTab) return;
    
    clearTimeout(state.undoTimeout);
    state.undoTimeout = setTimeout(() => {
        const newContent = elements.editor.innerHTML;
        
        if (currentTab.content !== newContent) {
            currentTab.content = newContent;
            saveToUndoStack();
            updateStats();
            updateLineNumbers();
        }
    }, 500);
}

function handleEditorKeydown(e) {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
            return;
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
            e.preventDefault();
            redo();
            return;
        }
    }
    
    const importantKeys = ['Enter', 'Delete', 'Backspace', 'Tab'];
    if (importantKeys.includes(e.key) || (e.key.length === 1 && !e.ctrlKey)) {
        setTimeout(() => {
            saveToUndoStack();
        }, 10);
    }
}

function updateEditorContent() {
    const currentTab = getCurrentTab();
    elements.editor.innerHTML = currentTab.content || '';
}

function saveCurrentTabContent() {
    const currentTab = getCurrentTab();
    if (currentTab) {
        currentTab.content = elements.editor.innerHTML;
    }
}

// Undo/Redo System (dibatasi)
function saveToUndoStack() {
    const currentTab = getCurrentTab();
    if (!currentTab) return;
    
    const tabId = currentTab.id;
    const currentContent = elements.editor.innerHTML;
    
    if (!state.undoStacks[tabId]) {
        state.undoStacks[tabId] = [];
        state.redoStacks[tabId] = [];
    }
    
    if (state.undoStacks[tabId].length === 0 || 
        state.undoStacks[tabId][state.undoStacks[tabId].length - 1] !== currentContent) {
        
        state.undoStacks[tabId].push(currentContent);
        
        if (state.undoStacks[tabId].length > state.maxUndoSteps) {
            state.undoStacks[tabId].shift();
        }
        
        state.redoStacks[tabId] = [];
        updateUndoRedoButtons();
    }
}

function undo() {
    const currentTab = getCurrentTab();
    if (!currentTab) return;
    
    const tabId = currentTab.id;
    const undoBtn = document.getElementById('undoBtn');
    
    if (!state.undoStacks[tabId] || state.undoStacks[tabId].length < 2) {
        showNotification('Tidak ada aksi untuk di-undo', 'info');
        return;
    }
    
    if (undoBtn) {
        undoBtn.classList.add('undo-animation');
        setTimeout(() => undoBtn.classList.remove('undo-animation'), 500);
    }
    
    const currentContent = elements.editor.innerHTML;
    if (!state.redoStacks[tabId]) state.redoStacks[tabId] = [];
    state.redoStacks[tabId].push(currentContent);
    
    state.undoStacks[tabId].pop();
    const previousState = state.undoStacks[tabId].pop();
    
    if (previousState !== undefined) {
        elements.editor.innerHTML = previousState;
        currentTab.content = previousState;
        state.undoStacks[tabId].push(previousState);
        
        updateStats();
        updateLineNumbers();
        updateUndoRedoButtons();
        elements.editor.focus();
        
        showNotification('Undo berhasil', 'success');
    }
}

function redo() {
    const currentTab = getCurrentTab();
    if (!currentTab) return;
    
    const tabId = currentTab.id;
    const redoBtn = document.getElementById('redoBtn');
    
    if (!state.redoStacks[tabId] || state.redoStacks[tabId].length === 0) {
        showNotification('Tidak ada aksi untuk di-redo', 'info');
        return;
    }
    
    if (redoBtn) {
        redoBtn.classList.add('redo-animation');
        setTimeout(() => redoBtn.classList.remove('redo-animation'), 500);
    }
    
    const currentContent = elements.editor.innerHTML;
    state.undoStacks[tabId].push(currentContent);
    
    const nextState = state.redoStacks[tabId].pop();
    
    if (nextState !== undefined) {
        elements.editor.innerHTML = nextState;
        currentTab.content = nextState;
        
        updateStats();
        updateLineNumbers();
        updateUndoRedoButtons();
        elements.editor.focus();
        
        showNotification('Redo berhasil', 'success');
    }
}

function updateUndoRedoButtons() {
    const currentTab = getCurrentTab();
    if (!currentTab) return;
    
    const tabId = currentTab.id;
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        const canUndo = state.undoStacks[tabId] && state.undoStacks[tabId].length > 1;
        undoBtn.disabled = !canUndo;
        undoBtn.style.opacity = canUndo ? '1' : '0.5';
        undoBtn.title = canUndo ? 'Undo (Ctrl+Z)' : 'Tidak ada aksi untuk di-undo';
    }
    
    if (redoBtn) {
        const canRedo = state.redoStacks[tabId] && state.redoStacks[tabId].length > 0;
        redoBtn.disabled = !canRedo;
        redoBtn.style.opacity = canRedo ? '1' : '0.5';
        redoBtn.title = canRedo ? 'Redo (Ctrl+Y)' : 'Tidak ada aksi untuk di-redo';
    }
}

function initUndoRedoForTab(tabId) {
    const tab = state.tabs.find(t => t.id === tabId);
    
    if (!state.undoStacks[tabId]) {
        state.undoStacks[tabId] = [];
    }
    
    if (!state.redoStacks[tabId]) {
        state.redoStacks[tabId] = [];
    }
    
    state.redoStacks[tabId] = [];
    
    if (tab && tab.content && state.undoStacks[tabId].length === 0) {
        state.undoStacks[tabId].push(tab.content);
    } else if (state.undoStacks[tabId].length === 0) {
        state.undoStacks[tabId].push('');
    }
    
    updateUndoRedoButtons();
}

function initUndoRedo() {
    state.tabs.forEach(tab => {
        if (!state.undoStacks[tab.id]) {
            state.undoStacks[tab.id] = [];
        }
        if (!state.redoStacks[tab.id]) {
            state.redoStacks[tab.id] = [];
        }
        
        if (state.undoStacks[tab.id].length === 0 && tab.content) {
            state.undoStacks[tab.id].push(tab.content);
        }
    });
}

// Formatting Functions
function execCommand(command) {
    document.execCommand(command, false, null);
    elements.editor.focus();
    updateToolbarState();
}

function updateToolbarState() {
    document.querySelectorAll('[data-command]').forEach(btn => {
        const command = btn.dataset.command;
        btn.classList.toggle('active', document.queryCommandState(command));
    });
}

function applyFont() {
    const font = elements.fontSelect.value;
    document.execCommand('fontName', false, font);
}

function applyFontSize() {
    const size = elements.fontSizeSelect.value;
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = size + 'px';
        span.appendChild(range.extractContents());
        range.insertNode(span);
        elements.editor.normalize();
    }
}

function applyTextColor() {
    const color = elements.textColor.value;
    const selection = window.getSelection();
    
    if (selection.rangeCount === 0 || selection.isCollapsed) {
        document.execCommand('foreColor', false, color);
        return;
    }
    
    saveToUndoStack();
    const range = selection.getRangeAt(0);
    
    let element = range.commonAncestorContainer;
    if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement;
    }
    
    if (element.style && element.style.color) {
        element.style.color = color;
    } else {
        const span = document.createElement('span');
        span.style.color = color;
        
        if (element.getAttribute('style')) {
            const existingStyles = element.getAttribute('style');
            if (!existingStyles.includes('color:')) {
                span.setAttribute('style', existingStyles + '; color: ' + color);
            }
        }
        
        span.appendChild(range.extractContents());
        range.insertNode(span);
        
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
    }
    
    cleanEditorContent();
    saveCurrentTabContent();
    elements.editor.focus();
    showNotification(`Warna teks diterapkan: ${color}`);
}

function applyBackgroundColor() {
    const color = elements.backgroundColor.value;
    document.execCommand('backColor', false, color);
    
    if (color === '#ffffff00' || color === 'transparent') {
        removeBackgroundColor();
        return;
    }
    
    elements.editor.focus();
}

function removeBackgroundColor() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const selectedElement = range.commonAncestorContainer.parentElement;
        
        if (selectedElement) {
            removeBackgroundFromElement(selectedElement);
            
            const childrenWithBg = selectedElement.querySelectorAll('[style*="background"]');
            childrenWithBg.forEach(el => {
                el.style.backgroundColor = '';
            });
        }
    }
    
    elements.editor.focus();
}

function removeBackgroundFromElement(element) {
    if (element.style) {
        element.style.backgroundColor = '';
        element.style.background = '';
    }
    
    if (element.hasAttribute('style')) {
        const style = element.getAttribute('style');
        const newStyle = style
            .replace(/background-color:[^;]+;?/gi, '')
            .replace(/background:[^;]+;?/gi, '')
            .trim();
        
        if (newStyle) {
            element.setAttribute('style', newStyle);
        } else {
            element.removeAttribute('style');
        }
    }
}

// Color Pickers
function setupColorPickers() {
    // Text color picker
    elements.textColor.addEventListener('input', applyTextColor);
    elements.textColor.addEventListener('dblclick', () => {
        const defaultColor = state.currentTheme === 'dark' ? '#e4e6eb' : '#333333';
        elements.textColor.value = defaultColor;
        resetTextColor();
    });
    
    // Background color picker
    elements.backgroundColor.addEventListener('input', applyBackgroundColor);
    elements.backgroundColor.addEventListener('dblclick', () => {
        elements.backgroundColor.value = '#ffffff00';
        removeBackgroundColor();
        showNotification('Latar belakang diatur ke transparan');
    });
}

function resetTextColor() {
    const selection = window.getSelection();
    
    if (selection.rangeCount === 0 || selection.isCollapsed) {
        const defaultColor = state.currentTheme === 'dark' ? '#e4e6eb' : '#333333';
        document.execCommand('foreColor', false, defaultColor);
        showNotification('Warna teks direset ke default');
        return;
    }
    
    saveToUndoStack();
    const range = selection.getRangeAt(0);
    const selectedText = range.extractContents();
    const textNode = document.createTextNode(selectedText.textContent);
    range.insertNode(textNode);
    
    cleanEditorContent();
    saveCurrentTabContent();
    elements.editor.focus();
    showNotification('Warna teks direset ke default');
}

// Clean editor content
function cleanEditorContent() {
    const emptySpans = elements.editor.querySelectorAll('span');
    emptySpans.forEach(span => {
        if (!span.hasAttribute('style') || span.getAttribute('style').trim() === '') {
            span.replaceWith(...span.childNodes);
        } else if (span.hasAttribute('style')) {
            const style = span.getAttribute('style');
            const newStyle = style
                .replace(/color:\s*transparent\s*;?/gi, '')
                .replace(/color:\s*#ffffff00\s*;?/gi, '')
                .replace(/color:\s*#00000000\s*;?/gi, '')
                .replace(/;+/g, ';')
                .trim();
            
            if (newStyle === '' || newStyle === ';') {
                span.removeAttribute('style');
                if (span.childNodes.length === 1 && span.firstChild.nodeType === Node.TEXT_NODE) {
                    span.replaceWith(...span.childNodes);
                }
            } else {
                span.setAttribute('style', newStyle);
            }
        }
    });
    
    elements.editor.normalize();
}

// Highlight Functions
function setupHighlightColors() {
    document.querySelectorAll('.highlight-color:not(.disabled)').forEach(color => {
        color.addEventListener('click', () => {
            if (color.classList.contains('disabled')) {
                showNotification('Warna stabilo ini hanya tersedia di versi lengkap', 'warning');
                showBuyModal();
                return;
            }
            
            document.querySelectorAll('.highlight-color').forEach(c => {
                c.classList.toggle('active', c === color);
            });
            state.currentHighlightColor = color.dataset.color;
        });
    });
}

function applyHighlight() {
    const selection = window.getSelection();
    if (!selection.toString().trim()) {
        showNotification('Pilih teks terlebih dahulu', 'warning');
        return;
    }
    
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = `highlight-${state.currentHighlightColor}`;
    span.style.backgroundColor = getHighlightColor(state.currentHighlightColor);
    span.style.padding = '0 2px';
    span.style.borderRadius = '3px';
    
    span.appendChild(range.extractContents());
    range.insertNode(span);
    
    selection.removeAllRanges();
    showNotification(`Teks disorot dengan warna ${state.currentHighlightColor}`);
}

function removeHighlight() {
    const selection = window.getSelection();
    if (!selection.toString().trim()) {
        showNotification('Pilih teks yang disorot', 'warning');
        return;
    }
    
    const range = selection.getRangeAt(0);
    const selectedElement = range.commonAncestorContainer.parentElement;
    
    if (selectedElement.className.startsWith('highlight-')) {
        const text = selectedElement.textContent;
        selectedElement.parentNode.replaceChild(document.createTextNode(text), selectedElement);
        showNotification('Stabilo dihapus');
    } else {
        showNotification('Teks tidak memiliki stabilo', 'warning');
    }
}

function getHighlightColor(name) {
    const colors = {
        yellow: '#FFF176',
        green: '#81C784',
        blue: '#64B5F6',
        pink: '#F48FB1',
        orange: '#FFB74D',
        purple: '#BA68C8'
    };
    return colors[name] || colors.yellow;
}

// Search Functions (tanpa replace)
function performSearch() {
    const searchTerm = elements.searchInput.value.trim();
    if (!searchTerm) {
        showNotification('Masukkan kata kunci pencarian', 'warning');
        return;
    }
    
    state.lastSearchTerm = searchTerm;
    const content = elements.editor.textContent || elements.editor.innerText;
    const regex = new RegExp(searchTerm, 'gi');
    state.searchResults = [];
    
    let match;
    while ((match = regex.exec(content)) !== null) {
        state.searchResults.push({
            index: match.index,
            length: match[0].length
        });
    }
    
    if (state.searchResults.length === 0) {
        elements.searchResults.textContent = `Tidak ditemukan hasil untuk "${searchTerm}"`;
        elements.searchNav.style.display = 'none';
        removeSearchHighlights();
        return;
    }
    
    elements.searchResults.textContent = `Ditemukan ${state.searchResults.length} hasil untuk "${searchTerm}"`;
    elements.searchNav.style.display = 'flex';
    state.currentMatchIndex = -1;
    
    highlightSearchMatches(searchTerm);
    navigateToNextMatch();
}

function highlightSearchMatches(searchTerm) {
    removeSearchHighlights();
    if (!searchTerm) return;
    
    try {
        const content = elements.editor.innerHTML;
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        
        const highlightedContent = content.replace(regex, (match) => {
            return `<mark class="search-match">${match}</mark>`;
        });
        
        elements.editor.innerHTML = highlightedContent;
    } catch (error) {
        console.error('Error highlighting search:', error);
    }
}

function removeSearchHighlights() {
    const matches = elements.editor.querySelectorAll('.search-match');
    matches.forEach(match => {
        const parent = match.parentNode;
        parent.replaceChild(document.createTextNode(match.textContent), match);
    });
}

function navigateToPrevMatch() {
    if (state.searchResults.length === 0) return;
    
    state.currentMatchIndex = (state.currentMatchIndex - 1 + state.searchResults.length) % state.searchResults.length;
    navigateToMatch(state.currentMatchIndex);
}

function navigateToNextMatch() {
    if (state.searchResults.length === 0) return;
    
    state.currentMatchIndex = (state.currentMatchIndex + 1) % state.searchResults.length;
    navigateToMatch(state.currentMatchIndex);
}

function navigateToMatch(index) {
    if (index < 0 || index >= state.searchResults.length) return;
    
    const searchTerm = elements.searchInput.value.trim();
    const match = state.searchResults[index];
    
    const textNode = elements.editor.childNodes[0];
    if (!textNode) return;
    
    const range = document.createRange();
    let currentPos = 0;
    let found = false;
    
    function walkNodes(node) {
        if (found) return;
        
        if (node.nodeType === 3) {
            if (currentPos + node.textContent.length >= match.index) {
                const positionInNode = match.index - currentPos;
                range.setStart(node, positionInNode);
                range.setEnd(node, positionInNode + match.length);
                found = true;
            }
            currentPos += node.textContent.length;
        } else if (node.nodeType === 1) {
            for (const child of node.childNodes) {
                walkNodes(child);
                if (found) break;
            }
        }
    }
    
    walkNodes(elements.editor);
    
    if (found) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        range.getBoundingClientRect();
        elements.editor.scrollTop = range.getBoundingClientRect().top - elements.editor.getBoundingClientRect().top + elements.editor.scrollTop - 100;
        
        elements.searchResults.textContent = `Hasil ${index + 1} dari ${state.searchResults.length}`;
    }
}

// File Operations (terbatas)
function createNewFile() {
    if (state.tabs.length >= state.maxTabs) {
        showNotification(`Versi demo maksimal ${state.maxTabs} tab. Upgrade untuk unlimited tabs.`, 'warning');
        showBuyModal();
        return;
    }
    
    addNewTab();
    showNotification('File baru dibuat');
}

function openFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        getCurrentTab().content = content.replace(/\n/g, '<br>');
        getCurrentTab().title = file.name;
        updateEditorContent();
        renderTabs();
        updateStats();
        showNotification(`File "${file.name}" berhasil dibuka`);
    };
    
    reader.readAsText(file);
    elements.fileInput.value = '';
}

function saveToFile() {
    const currentTab = getCurrentTab();
    let content = elements.editor.textContent || '';
    
    // Format untuk Notepad Windows
    content = content
        .replace(/<br>/gi, '\n')
        .replace(/<\/?[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
    
    let fileName = currentTab.title || 'Untitled';
    if (!fileName.toLowerCase().endsWith('.txt')) {
        fileName += '.txt';
    }
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`✅ File "${fileName}" berhasil disimpan`);
}

function updateStats() {
    const content = elements.editor.textContent || '';
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const chars = content.length;
    const lines = content.split('\n').length;
    const pages = Math.ceil(words.length / 250) || 1;
    
    if (elements.wordCount) elements.wordCount.textContent = words.length;
    if (elements.charCount) elements.charCount.textContent = chars;
    if (elements.lineCount) elements.lineCount.textContent = lines;
    if (elements.pageCount) elements.pageCount.textContent = pages;
}

function printDocument() {
    const printContent = elements.editor.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <div style="font-family: Arial; padding: 20mm; line-height: 1.6;">
            ${printContent}
            <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
                Dicetak dari ZenWrite Lite - Versi Demo
            </div>
        </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    updateEditorContent();
    showNotification('Dokumen dicetak');
}

function showWordCountModal() {
    const content = elements.editor.textContent || '';
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const chars = content.length;
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const pages = Math.ceil(words.length / 500) || 1;
    
    alert(`Statistik Dokumen:
    Kata: ${words.length}
    Karakter: ${chars}
    Baris: ${lines.length}
    Halaman: ${pages}
    Karakter (tanpa spasi): ${content.replace(/\s/g, '').length}
    
    ---
    ZenWrite Lite - Versi Demo`);
}

// Line Numbers
function updateLineNumbers() {
    const content = elements.editor.textContent || '';
    const lineCount = Math.max(content.split('\n').length, 1);
    
    let numbers = '';
    for (let i = 1; i <= lineCount; i++) {
        numbers += `${i}<br>`;
    }
    
    elements.lineNumbers.innerHTML = numbers;
}

// Sidebar Functions
function handleSidebarToggle() {
    if (state.isMobile) {
        hideSidebarMobile();
    } else {
        toggleSidebarDesktop();
    }
}

function toggleSidebarDesktop() {
    state.isSidebarCollapsed = !state.isSidebarCollapsed;
    
    if (state.isSidebarCollapsed) {
        elements.sidebar.classList.add('collapsed');
        elements.sidebarToggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
        elements.sidebarToggle.title = 'Tampilkan Sidebar';
        showNotification('Sidebar disembunyikan');
    } else {
        elements.sidebar.classList.remove('collapsed');
        elements.sidebarToggle.innerHTML = '<i class="fas fa-chevron-left"></i>';
        elements.sidebarToggle.title = 'Sembunyikan Sidebar';
        showNotification('Sidebar ditampilkan');
    }
    
    saveState();
}

function toggleSidebarMobile() {
    elements.sidebar.classList.add('show');
    elements.sidebarOverlay.classList.add('show');
    elements.sidebarToggle.innerHTML = '<i class="fas fa-times"></i>';
    elements.sidebarToggle.title = 'Tutup Sidebar';
}

function hideSidebarMobile() {
    elements.sidebar.classList.remove('show');
    elements.sidebarOverlay.classList.remove('show');
    elements.sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>';
    elements.sidebarToggle.title = 'Buka Sidebar';
}

// Theme Functions
function toggleTheme() {
    state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
    document.body.className = `${state.currentTheme}-theme`;
    elements.themeToggle.innerHTML = state.currentTheme === 'light' ? 
        '<i class="fas fa-moon"></i>' : 
        '<i class="fas fa-sun"></i>';
    saveState();
    showNotification(`Mode ${state.currentTheme === 'light' ? 'terang' : 'gelap'} diaktifkan`);
}

// Copy/Paste Functions
function setupCopyPaste() {
    elements.editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        document.execCommand('insertText', false, text);
    });
}

function handleCopy(e) {
    setTimeout(() => {
        showNotification('Teks disalin ke clipboard');
    }, 100);
}

function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, text);
    showNotification('Teks ditempel (format dihapus)');
}

function handleCut(e) {
    setTimeout(() => {
        showNotification('Teks dipotong');
    }, 100);
}

function handleCopyButton() {
    document.execCommand('copy');
    showNotification('Teks disalin');
}

function handlePasteButton() {
    elements.editor.focus();
    
    if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText()
            .then(text => {
                document.execCommand('insertText', false, text);
                showNotification('Teks ditempel (format dihapus)');
            })
            .catch(err => {
                fallbackPaste();
            });
    } else {
        fallbackPaste();
    }
}

function fallbackPaste() {
    elements.pasteArea.focus();
    elements.pasteArea.value = '';
    
    setTimeout(() => {
        document.execCommand('paste');
        setTimeout(() => {
            const text = elements.pasteArea.value;
            if (text) {
                elements.editor.focus();
                document.execCommand('insertText', false, text);
                showNotification('Teks ditempel (format dihapus)');
            }
            elements.pasteArea.value = '';
        }, 100);
    }, 100);
}

function handleCutButton() {
    document.execCommand('cut');
    showNotification('Teks dipotong');
}

// Window resize untuk mobile
function handleWindowResize() {
    const wasMobile = state.isMobile;
    state.isMobile = window.innerWidth <= 768;
    
    if (wasMobile !== state.isMobile) {
        updateSidebarForMobile();
    }
}

// Update sidebar untuk mobile/desktop
function updateSidebarForMobile() {
    const isMobile = window.innerWidth <= 768;
    state.isMobile = isMobile;
    
    if (isMobile) {
        elements.sidebar.classList.remove('collapsed');
        elements.sidebar.classList.remove('show');
        elements.sidebarOverlay.classList.remove('show');
        elements.sidebarToggle.style.display = 'block';
        elements.sidebarToggle.innerHTML = '<i class="fas fa-times"></i>';
        elements.sidebarToggle.title = 'Tutup Sidebar';
    } else {
        elements.sidebar.classList.remove('show');
        elements.sidebarOverlay.classList.remove('show');
        elements.sidebarToggle.style.display = 'block';
        
        if (state.isSidebarCollapsed) {
            elements.sidebar.classList.add('collapsed');
            elements.sidebarToggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
            elements.sidebarToggle.title = 'Tampilkan Sidebar';
        } else {
            elements.sidebar.classList.remove('collapsed');
            elements.sidebarToggle.innerHTML = '<i class="fas fa-chevron-left"></i>';
            elements.sidebarToggle.title = 'Sembunyikan Sidebar';
        }
    }
}

// Buy Modal
function showBuyModal() {
    elements.buyModal.classList.add('show');
}

// Notification
function showNotification(message, type = 'success') {
    elements.notificationText.textContent = message;
    elements.notification.className = 'notification';
    
    if (type === 'error') {
        elements.notification.classList.add('error');
        elements.notification.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${message}</span>`;
    } else if (type === 'warning') {
        elements.notification.classList.add('warning');
        elements.notification.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>${message}</span>`;
    } else if (type === 'info') {
        elements.notification.innerHTML = `<i class="fas fa-info-circle"></i><span>${message}</span>`;
    } else {
        elements.notification.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
    }
    
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Hide loading
    setTimeout(function() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.remove(), 300);
        }
        init();
    }, 500);
    
    // Window resize event
    window.addEventListener('resize', handleWindowResize);
    
    // Auto-save
    setInterval(() => {
        if (elements.editor.textContent.length > 0) {
            saveCurrentTabContent();
            saveState();
        }
    }, 60000);
});