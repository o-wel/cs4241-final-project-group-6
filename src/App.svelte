<script>
    import {onMount} from "svelte";

    let characterMap = $state({}); // Letters revealed so far by guesses.
    let guesses = $state([]); // Past guesses for this session.
    let input = $state(''); // Current guess word.

    function getLetterColor(letter) {
        if (characterMap[letter] === -1) return 'bg-gray-800';
        if (characterMap[letter] === 0) return 'bg-yellow-600';
        if (characterMap[letter] === 1) return 'bg-green-700';

        return 'bg-gray-500';
    }

    function guess() {
        if (input.length !== 8) return;

        // Temporary logic to just randomly assign colors.
        input.split('').forEach(letter => characterMap[letter] = Math.trunc(Math.random() * 5 - 2.5));
        guesses.push(input);
        input = '';
    }

    function inputLetter(key) {
        if (input.length === 8) return;
        input += key;
    }

    function undoLetter() {
        input = input.slice(0, input.length - 1);
    }

    onMount(() => {
        document.onkeydown = (event) => {
            if (event.code === 'Backspace') {
                undoLetter();
            } else if (event.code === 'Enter') {
                guess();
            } else if (event.key.length === 1 && event.key.match(/[a-zA-Z]/) && !(event.ctrlKey || event.metaKey)) {
                inputLetter(event.key.toUpperCase());
            }
        }
    });
</script>

<main>
    <div class="grid grid-rows-5 gap-y-4 pb-6">
        {#each { length: 5 }, guessIndex }
            {@const isEmpty = guessIndex > guesses.length }
            {@const isPastGuess = guessIndex < guesses.length }

            <div class="grid grid-cols-8 gap-x-4">
                {#each { length: 8 }, charIndex }
                    {@const letter = isPastGuess ? guesses[guessIndex][charIndex] : input[charIndex] }

                    <div class="{isPastGuess ? getLetterColor(letter) + ' text-white' : 'border-3 border-gray-300 text-black'} aspect-square uppercase font-bold min-w-16 text-4xl flex justify-center items-center">
                        {isEmpty ? '' : letter}
                    </div>
                {/each}
            </div>
        {/each}
    </div>

    <div class="flex items-stretch justify-center gap-x-2 py-1">
        {#each ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'] as letter}
            <button class="{getLetterColor(letter)} rounded-sm font-bold min-w-10 cursor-pointer p-3 text-lg text-white" onclick={() => inputLetter(letter)}>{letter}</button>
        {/each}
    </div>

    <div class="flex items-stretch justify-center gap-x-2 py-1">
        {#each ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'] as letter}
            <button class="{getLetterColor(letter)} rounded-sm font-bold min-w-10 cursor-pointer p-3 text-lg text-white" onclick={() => inputLetter(letter)}>{letter}</button>
        {/each}
    </div>

    <div class="flex items-stretch justify-center gap-x-2 py-1">
        <button class="bg-gray-600 rounded-sm font-bold min-w-10 cursor-pointer p-3 text-md text-white" onclick={guess}>ENTER</button>
        {#each ['Z', 'X', 'C', 'V', 'B', 'N', 'M'] as letter}
            <button class="{getLetterColor(letter)} rounded-sm font-bold min-w-10 cursor-pointer p-3 text-lg text-white" onclick={() => inputLetter(letter)}>{letter}</button>
        {/each}
        <button class="bg-gray-600 rounded-sm font-bold min-w-10 cursor-pointer p-3 text-xl text-white" onclick={undoLetter}>‹</button>
    </div>
</main>
