<script>
    import {onMount} from "svelte";

    let characterMap = $state({}); // Letters revealed so far by guesses.
    let guesses = $state([]); // Past guesses for this session.
    let input = $state(''); // Current guess word.
    let announcement = $state(''); // For screen reader announcements
    let gameStatus = $state('playing'); // 'playing', 'won', 'lost'
    
    // Accessibility settings
    let theme = $state('dark'); // 'dark', 'light', 'high-contrast'
    let fontSize = $state('medium'); // 'small', 'medium', 'large', 'x-large'
    let spacing = $state('normal'); // 'narrow', 'normal', 'wide'
    let colorBlindMode = $state('none'); // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
    let showSettingsPanel = $state(false);

    function getLetterColor(letter) {
        const status = getLetterStatus(letter);
        
        // Base colors by theme
        const colorMap = {
            dark: {
                absent: 'bg-gray-800',
                present: 'bg-yellow-600',
                correct: 'bg-green-700',
                unused: 'bg-gray-500'
            },
            light: {
                absent: 'bg-gray-400',
                present: 'bg-yellow-500',
                correct: 'bg-green-600',
                unused: 'bg-gray-300'
            },
            'high-contrast': {
                absent: 'bg-black border-2 border-white',
                present: 'bg-yellow-300',
                correct: 'bg-blue-600',
                unused: 'bg-gray-700 border-2 border-gray-400'
            }
        };

        // Override colors for colorblind modes
        if (colorBlindMode !== 'none' && status === 'correct') {
            if (colorBlindMode === 'protanopia' || colorBlindMode === 'deuteranopia') {
                return 'colorblind-correct-blue';
            } else if (colorBlindMode === 'tritanopia') {
                return 'colorblind-correct-magenta';
            }
        }
        
        if (colorBlindMode !== 'none' && status === 'present') {
            if (colorBlindMode === 'protanopia') {
                return 'colorblind-present-orange';
            } else if (colorBlindMode === 'deuteranopia') {
                return 'colorblind-present-amber';
            } else if (colorBlindMode === 'tritanopia') {
                return 'colorblind-present-cyan';
            }
        }

        return colorMap[theme][status];
    }

    function getLetterStatus(letter) {
        if (characterMap[letter] === -1) return 'absent';
        if (characterMap[letter] === 0) return 'present';
        if (characterMap[letter] === 1) return 'correct';
        return 'unused';
    }

    async function guess() {
        if (input.length !== 8) {
            announcement = `Word must be 8 letters. Current word has ${input.length} letters.`;
            return;
        }

        try {
            const res = await fetch('/guess', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({word: input})
            })

            if (!res.ok) {
                const err = await res.json()
                announcement = err.error || 'Error submitting guess'
                return;
            }

            const data = await res.json()
            const feedback = data.feedback

            input.split('').forEach((letter, i) => characterMap[letter] = feedback[i])
            guesses.push(input)

            // Announce the guess result
            const guessNumber = guesses.length;
            announcement = `Guess ${guessNumber} submitted: ${input}. ${5 - guessNumber} guesses remaining.`;

            input = '';
        } catch (err) {
            console.error(err)
            announcement = 'Network error while submitting guess'
        }
    }

    function inputLetter(key) {
        if (input.length === 8) {
            announcement = 'Word is complete. Press Enter to submit or Backspace to edit.';
            return;
        }
        input += key;
    }

    function undoLetter() {
        if (input.length > 0) {
            const removed = input[input.length - 1];
            input = input.slice(0, input.length - 1);
            announcement = `Removed letter ${removed}. ${input.length} of 8 letters entered.`;
        }
    }

    function cycleTheme() {
        const themes = ['dark', 'light', 'high-contrast'];
        const current = themes.indexOf(theme);
        theme = themes[(current + 1) % themes.length];
        announcement = `Theme changed to ${theme.replace('-', ' ')}`;
    }

    function cycleFontSize() {
        const sizes = ['small', 'medium', 'large', 'x-large'];
        const current = sizes.indexOf(fontSize);
        fontSize = sizes[(current + 1) % sizes.length];
        announcement = `Font size changed to ${fontSize}`;
    }

    function cycleSpacing() {
        const spacings = ['narrow', 'normal', 'wide'];
        const current = spacings.indexOf(spacing);
        spacing = spacings[(current + 1) % spacings.length];
        announcement = `Spacing changed to ${spacing}`;
    }

    function cycleColorBlindMode() {
        const modes = ['none', 'protanopia', 'deuteranopia', 'tritanopia'];
        const current = modes.indexOf(colorBlindMode);
        colorBlindMode = modes[(current + 1) % modes.length];
        const modeName = colorBlindMode === 'none' ? 'standard colors' : colorBlindMode;
        announcement = `Color blind mode: ${modeName}`;
    }

    onMount(() => {
        // Detect system preferences
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        
        if (!prefersDark.matches) theme = 'light';

        // Load saved preferences
        const savedTheme = localStorage.getItem('wordle-theme');
        const savedFontSize = localStorage.getItem('wordle-font-size');
        const savedSpacing = localStorage.getItem('wordle-spacing');
        const savedColorBlindMode = localStorage.getItem('wordle-colorblind-mode');
        
        if (savedTheme) theme = savedTheme;
        if (savedFontSize) fontSize = savedFontSize;
        if (savedSpacing) spacing = savedSpacing;
        if (savedColorBlindMode) colorBlindMode = savedColorBlindMode;

        // Announce game start
        announcement = 'Wordle game started. Guess the 8-letter word. You have 5 attempts.';

        document.onkeydown = (event) => {
            if (event.code === 'Backspace') {
                event.preventDefault();
                undoLetter();
            } else if (event.code === 'Enter') {
                event.preventDefault();
                guess();
            } else if (event.key.length === 1 && event.key.match(/[a-zA-Z]/) && !(event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                inputLetter(event.key.toUpperCase());
            }
        }
    });

    // Save preferences when they change
    $effect(() => {
        localStorage.setItem('wordle-theme', theme);
        localStorage.setItem('wordle-font-size', fontSize);
        localStorage.setItem('wordle-spacing', spacing);
        localStorage.setItem('wordle-colorblind-mode', colorBlindMode);
    });
</script>

<svelte:head>
    <title>Accessible Wordle Clone</title>
</svelte:head>

<div 
    class="app-container"
    data-theme={theme}
    data-font-size={fontSize}
    data-spacing={spacing}
    data-colorblind={colorBlindMode}
>
    <!-- Accessibility Toolbar -->
    <div class="accessibility-toolbar" role="complementary" aria-label="Accessibility settings">
        <button
            class="toolbar-button"
            onclick={() => showSettingsPanel = !showSettingsPanel}
            aria-label="Toggle accessibility settings panel"
            aria-expanded={showSettingsPanel}
            title="Accessibility Settings"
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m5.2-15.8l-4.2 4.2m0 5.2l-4.2 4.2m11.2-5.2l-6-6m-6 6l-6 6"></path>
            </svg>
            <span class="sr-only">Settings</span>
        </button>

        {#if showSettingsPanel}
            <div class="settings-panel" role="dialog" aria-label="Accessibility settings">
                <h2 class="settings-title">Accessibility Settings</h2>
                
                <div class="setting-group">
                    <button onclick={cycleTheme} class="setting-button" aria-label="Change theme, currently {theme}">
                        <span class="setting-icon">🎨</span>
                        <div class="setting-info">
                            <span class="setting-label">Theme</span>
                            <span class="setting-value">{theme.replace('-', ' ')}</span>
                        </div>
                    </button>
                </div>

                <div class="setting-group">
                    <button onclick={cycleFontSize} class="setting-button" aria-label="Change font size, currently {fontSize}">
                        <span class="setting-icon">Aa</span>
                        <div class="setting-info">
                            <span class="setting-label">Font Size</span>
                            <span class="setting-value">{fontSize}</span>
                        </div>
                    </button>
                </div>

                <div class="setting-group">
                    <button onclick={cycleSpacing} class="setting-button" aria-label="Change spacing, currently {spacing}">
                        <span class="setting-icon">↔️</span>
                        <div class="setting-info">
                            <span class="setting-label">Spacing</span>
                            <span class="setting-value">{spacing}</span>
                        </div>
                    </button>
                </div>

                <div class="setting-group">
                    <button onclick={cycleColorBlindMode} class="setting-button" aria-label="Change color blind mode, currently {colorBlindMode}">
                        <span class="setting-icon">👁️</span>
                        <div class="setting-info">
                            <span class="setting-label">Color Mode</span>
                            <span class="setting-value">{colorBlindMode === 'none' ? 'Standard' : colorBlindMode}</span>
                        </div>
                    </button>
                </div>

                <button 
                    class="close-settings"
                    onclick={() => showSettingsPanel = false}
                    aria-label="Close settings panel"
                >
                    Close
                </button>
            </div>
        {/if}
    </div>

    <main role="main" aria-label="Wordle game">
        <!-- Skip link for keyboard users -->
        <a href="#keyboard-section" class="sr-only focus:not-sr-only">
            Skip to keyboard
        </a>

        <h1 class="game-title">Wordle Clone</h1>

        <!-- Instructions -->
        <section aria-labelledby="instructions-heading" class="instructions">
            <h2 id="instructions-heading" class="sr-only">Game Instructions</h2>
            <p class="instructions-text">Guess the 8-letter word in 5 tries</p>
            <div class="color-legend">
                <div class="legend-item">
                    <span class="legend-box correct-box" aria-hidden="true"></span>
                    <span>Correct position</span>
                </div>
                <div class="legend-item">
                    <span class="legend-box present-box" aria-hidden="true"></span>
                    <span>Wrong position</span>
                </div>
                <div class="legend-item">
                    <span class="legend-box absent-box" aria-hidden="true"></span>
                    <span>Not in word</span>
                </div>
            </div>
        </section>

        <!-- Game board -->
        <div 
            class="game-board" 
            role="region" 
            aria-label="Game board"
            aria-live="polite"
            aria-atomic="false"
        >
            {#each { length: 5 }, guessIndex}
                {@const isEmpty = guessIndex > guesses.length }
                {@const isPastGuess = guessIndex < guesses.length }
                {@const isCurrentGuess = guessIndex === guesses.length }

                <div 
                    class="guess-row" 
                    role="group"
                    aria-label="Row {guessIndex + 1} of 5"
                >
                    {#each { length: 8 }, charIndex}
                        {@const letter = isPastGuess ? guesses[guessIndex][charIndex] : input[charIndex] }
                        {@const status = isPastGuess ? getLetterStatus(letter) : 'empty' }

                        <div 
                            class="letter-cell {isPastGuess ? getLetterColor(letter) : 'empty-cell'} {colorBlindMode !== 'none' && isPastGuess ? 'has-symbol' : ''}"
                            role="img"
                            aria-label="{isEmpty ? 'Empty cell' : letter + (isPastGuess ? ', ' + status : ', current guess')}"
                            data-status={isPastGuess ? status : 'empty'}
                        >
                            {isEmpty ? '' : letter}
                        </div>
                    {/each}
                </div>
            {/each}
        </div>

        <!-- Current guess status -->
        <div class="guess-status" aria-live="polite" aria-atomic="true">
            {#if input.length > 0}
                <span class="sr-only">Current guess: {input}, {input.length} of 8 letters</span>
                <span aria-hidden="true">Letters: {input.length}/8</span>
            {:else if guesses.length > 0}
                <span>Guesses used: {guesses.length}/5</span>
            {/if}
        </div>

        <!-- Keyboard section -->
        <section id="keyboard-section" aria-label="On-screen keyboard" class="keyboard-section">
            <h2 class="sr-only">Keyboard</h2>
            
            <div class="keyboard-row">
                {#each ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'] as letter}
                    <button 
                        class="key-button {getLetterColor(letter)} {colorBlindMode !== 'none' ? 'has-symbol' : ''}"
                        onclick={() => inputLetter(letter)}
                        aria-label="{letter}, {getLetterStatus(letter)}"
                        type="button"
                        data-status={getLetterStatus(letter)}
                    >
                        {letter}
                    </button>
                {/each}
            </div>

            <div class="keyboard-row">
                {#each ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'] as letter}
                    <button 
                        class="key-button {getLetterColor(letter)} {colorBlindMode !== 'none' ? 'has-symbol' : ''}"
                        onclick={() => inputLetter(letter)}
                        aria-label="{letter}, {getLetterStatus(letter)}"
                        type="button"
                        data-status={getLetterStatus(letter)}
                    >
                        {letter}
                    </button>
                {/each}
            </div>

            <div class="keyboard-row">
                <button 
                    class="key-button special-key"
                    onclick={guess}
                    aria-label="Submit guess"
                    type="button"
                    disabled={input.length !== 8}
                >
                    ENTER
                </button>
                {#each ['Z', 'X', 'C', 'V', 'B', 'N', 'M'] as letter}
                    <button 
                        class="key-button {getLetterColor(letter)} {colorBlindMode !== 'none' ? 'has-symbol' : ''}"
                        onclick={() => inputLetter(letter)}
                        aria-label="{letter}, {getLetterStatus(letter)}"
                        type="button"
                        data-status={getLetterStatus(letter)}
                    >
                        {letter}
                    </button>
                {/each}
                <button 
                    class="key-button special-key"
                    onclick={undoLetter}
                    aria-label="Delete last letter"
                    type="button"
                    disabled={input.length === 0}
                >
                    ‹
                </button>
            </div>

            <!-- Keyboard shortcuts help -->
            <div class="keyboard-help">
                <details>
                    <summary>Keyboard shortcuts</summary>
                    <ul class="shortcuts-list">
                        <li><kbd>A-Z</kbd> Type letters</li>
                        <li><kbd>Enter</kbd> Submit guess</li>
                        <li><kbd>Backspace</kbd> Delete letter</li>
                    </ul>
                </details>
            </div>
        </section>

        <!-- Live region for announcements (screen readers only) -->
        <div 
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
            class="sr-only"
        >
            {announcement}
        </div>
    </main>
</div>

<style>
    /* === SCREEN READER ONLY === */
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }

    .focus\:not-sr-only:focus {
        position: fixed;
        top: 0.5rem;
        left: 0.5rem;
        width: auto;
        height: auto;
        padding: 0.75rem 1rem;
        margin: 0;
        overflow: visible;
        clip: auto;
        white-space: normal;
        background: #000;
        color: #fff;
        z-index: 9999;
        border-radius: 4px;
        font-weight: bold;
    }

    /* === APP CONTAINER & THEMES === */
    .app-container {
        min-height: 100vh;
        transition: background-color 0.3s, color 0.3s;
    }

    .app-container[data-theme="dark"] {
        background: #121213;
        color: #ffffff;
    }

    .app-container[data-theme="light"] {
        background: #ffffff;
        color: #000000;
    }

    .app-container[data-theme="high-contrast"] {
        background: #000000;
        color: #ffffff;
    }

    /* === FONT SIZES === */
    .app-container[data-font-size="small"] {
        font-size: 14px;
    }

    .app-container[data-font-size="medium"] {
        font-size: 16px;
    }

    .app-container[data-font-size="large"] {
        font-size: 18px;
    }

    .app-container[data-font-size="x-large"] {
        font-size: 22px;
    }

    /* === SPACING SETTINGS === */
    .app-container[data-spacing="narrow"] .game-board {
        gap: 0.375rem;
    }

    .app-container[data-spacing="narrow"] .guess-row {
        gap: 0.375rem;
    }

    .app-container[data-spacing="narrow"] .keyboard-row {
        gap: 0.25rem;
    }

    .app-container[data-spacing="narrow"] .keyboard-section {
        gap: 0.375rem;
    }

    .app-container[data-spacing="wide"] .game-board {
        gap: 1rem;
    }

    .app-container[data-spacing="wide"] .guess-row {
        gap: 0.75rem;
    }

    .app-container[data-spacing="wide"] .keyboard-row {
        gap: 0.75rem;
    }

    .app-container[data-spacing="wide"] .keyboard-section {
        gap: 0.875rem;
    }

    /* === ACCESSIBILITY TOOLBAR === */
    .accessibility-toolbar {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
    }

    .toolbar-button {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        border: 2px solid currentColor;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, background 0.2s;
    }

    .toolbar-button:hover {
        transform: scale(1.1);
        background: rgba(0, 0, 0, 0.95);
    }

    .toolbar-button:focus {
        outline: 3px solid #538d4e;
        outline-offset: 2px;
    }

    [data-theme="light"] .toolbar-button {
        background: rgba(255, 255, 255, 0.95);
        color: black;
        border-color: #000;
    }

    [data-theme="high-contrast"] .toolbar-button {
        background: #fff;
        color: #000;
        border: 3px solid #fff;
    }

    /* === SETTINGS PANEL === */
    .settings-panel {
        position: absolute;
        top: 4rem;
        right: 0;
        width: 280px;
        background: #1a1a1b;
        border: 2px solid #3a3a3c;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    [data-theme="light"] .settings-panel {
        background: #ffffff;
        border-color: #d3d6da;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    [data-theme="high-contrast"] .settings-panel {
        background: #000;
        border: 3px solid #fff;
    }

    .settings-title {
        font-size: 1.25rem;
        font-weight: bold;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid #3a3a3c;
    }

    [data-theme="light"] .settings-title {
        border-bottom-color: #d3d6da;
    }

    [data-theme="high-contrast"] .settings-title {
        border-bottom-color: #fff;
    }

    .setting-group {
        margin-bottom: 0.75rem;
    }

    .setting-button {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        background: #2a2a2c;
        border: 1px solid #3a3a3c;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;
        color: inherit;
    }

    .setting-button:hover {
        background: #3a3a3c;
    }

    .setting-button:focus {
        outline: 2px solid #538d4e;
        outline-offset: 2px;
    }

    [data-theme="light"] .setting-button {
        background: #f6f7f8;
        border-color: #d3d6da;
    }

    [data-theme="light"] .setting-button:hover {
        background: #e6e8ea;
    }

    [data-theme="high-contrast"] .setting-button {
        background: #000;
        border: 2px solid #fff;
    }

    .setting-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
    }

    .setting-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .setting-label {
        font-weight: 600;
        font-size: 0.875rem;
    }

    .setting-value {
        font-size: 0.75rem;
        opacity: 0.7;
        text-transform: capitalize;
    }

    .close-settings {
        width: 100%;
        padding: 0.75rem;
        margin-top: 1rem;
        background: #538d4e;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s;
    }

    .close-settings:hover {
        background: #4a7c44;
    }

    .close-settings:focus {
        outline: 2px solid #fff;
        outline-offset: 2px;
    }

    /* === MAIN CONTENT === */
    main {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem 2rem;
    }

    .game-title {
        font-size: 2.5rem;
        font-weight: bold;
        text-align: center;
        margin-bottom: 1.5rem;
    }

    /* === INSTRUCTIONS === */
    .instructions {
        margin-bottom: 2rem;
        text-align: center;
    }

    .instructions-text {
        margin-bottom: 1rem;
        opacity: 0.8;
    }

    .color-legend {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        flex-wrap: wrap;
        font-size: 0.875rem;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .legend-box {
        width: 1.5rem;
        height: 1.5rem;
        display: inline-block;
        border-radius: 2px;
    }

    [data-theme="dark"] .correct-box { background: #538d4e; }
    [data-theme="dark"] .present-box { background: #b59f3b; }
    [data-theme="dark"] .absent-box { background: #3a3a3c; }

    [data-theme="light"] .correct-box { background: #6aaa64; }
    [data-theme="light"] .present-box { background: #c9b458; }
    [data-theme="light"] .absent-box { background: #787c7e; }

    [data-theme="high-contrast"] .correct-box { background: #0066ff; border: 2px solid #fff; }
    [data-theme="high-contrast"] .present-box { background: #ffcc00; border: 2px solid #fff; }
    [data-theme="high-contrast"] .absent-box { background: #000; border: 2px solid #fff; }

    /* === GAME BOARD === */
    .game-board {
        display: grid;
        grid-template-rows: repeat(5, 1fr);
        gap: 0.75rem;
        margin-bottom: 2rem;
    }

    .guess-row {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 0.5rem;
    }

    .letter-cell {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: bold;
        text-transform: uppercase;
        border-radius: 4px;
        transition: background-color 0.3s, transform 0.2s;
        color: white;
        position: relative;
    }

    .empty-cell {
        border: 2px solid #3a3a3c;
        color: inherit;
    }

    [data-theme="light"] .empty-cell {
        border-color: #d3d6da;
    }

    [data-theme="high-contrast"] .empty-cell {
        border: 3px solid #fff;
    }

    /* === GUESS STATUS === */
    .guess-status {
        text-align: center;
        margin-bottom: 2rem;
        opacity: 0.8;
        min-height: 1.5rem;
    }

    /* === KEYBOARD === */
    .keyboard-section {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
    }

    .keyboard-row {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
    }

    .key-button {
        min-width: 2.75rem;
        padding: 1.25rem 0.5rem;
        border-radius: 4px;
        border: none;
        font-weight: bold;
        font-size: 0.875rem;
        cursor: pointer;
        transition: transform 0.1s, filter 0.2s;
        color: white;
        position: relative;
    }

    .key-button:hover:not(:disabled) {
        filter: brightness(1.1);
        transform: scale(1.05);
    }

    .key-button:active:not(:disabled) {
        transform: scale(0.95);
    }

    .key-button:focus {
        outline: 3px solid #538d4e;
        outline-offset: 2px;
    }

    .key-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .special-key {
        background: #818384 !important;
        min-width: 4rem;
        font-size: 0.75rem;
    }

    [data-theme="light"] .special-key {
        background: #d3d6da !important;
        color: #000 !important;
    }

    [data-theme="high-contrast"] .special-key {
        background: #fff !important;
        color: #000 !important;
        border: 2px solid #fff !important;
    }

    /* === KEYBOARD HELP === */
    .keyboard-help {
        text-align: center;
        margin-top: 1rem;
        font-size: 0.875rem;
        opacity: 0.7;
    }

    summary {
        cursor: pointer;
        padding: 0.5rem;
        display: inline-block;
    }

    summary:hover {
        opacity: 1;
    }

    summary:focus {
        outline: 2px solid #538d4e;
        outline-offset: 2px;
        border-radius: 4px;
    }

    .shortcuts-list {
        list-style: none;
        padding: 0;
        margin-top: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    kbd {
        background: #3a3a3c;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: ui-monospace, monospace;
        font-size: 0.875em;
        margin-right: 0.5rem;
    }

    [data-theme="light"] kbd {
        background: #d3d6da;
        color: #000;
    }

    [data-theme="high-contrast"] kbd {
        background: #fff;
        color: #000;
        border: 2px solid #fff;
    }

    /* === COLOR BLIND FILTERS === */
    /* Colorblind mode color classes */
    .colorblind-correct-blue {
        background: #0066cc !important;
        color: white;
    }

    .colorblind-correct-magenta {
        background: #cc0066 !important;
        color: white;
    }

    .colorblind-present-orange {
        background: #ff8800 !important;
        color: white;
    }

    .colorblind-present-amber {
        background: #cc7700 !important;
        color: white;
    }

    .colorblind-present-cyan {
        background: #00cccc !important;
        color: black;
    }

    /* Add visual patterns for better distinction in colorblind modes */
    .has-symbol::after {
        position: absolute;
        font-size: 0.75em;
        opacity: 0.5;
        pointer-events: none;
        top: 0.25em;
        right: 0.25em;
    }

    .has-symbol[data-status="correct"]::after {
        content: "✓";
    }

    .has-symbol[data-status="present"]::after {
        content: "?";
    }

    .has-symbol[data-status="absent"]::after {
        content: "✕";
    }

    /* === RESPONSIVE === */
    @media (max-width: 640px) {
        main {
            padding: 1.5rem 0.5rem;
        }

        .game-title {
            font-size: 2rem;
        }

        .letter-cell {
            font-size: 1.5rem;
        }

        .key-button {
            min-width: 2rem;
            padding: 0.875rem 0.25rem;
            font-size: 0.75rem;
        }

        .special-key {
            min-width: 3rem;
        }

        .accessibility-toolbar {
            top: 0.5rem;
            right: 0.5rem;
        }

        .toolbar-button {
            width: 2.5rem;
            height: 2.5rem;
        }

        .settings-panel {
            width: calc(100vw - 2rem);
            right: -0.5rem;
        }

        .color-legend {
            gap: 1rem;
            font-size: 0.75rem;
        }

        .legend-box {
            width: 1.25rem;
            height: 1.25rem;
        }
    }

    /* === REDUCED MOTION === */
    @media (prefers-reduced-motion: reduce) {
        .app-container * {
            animation: none !important;
            transition: none !important;
        }
    }
</style>