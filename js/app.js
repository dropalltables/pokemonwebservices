let pokemonData = [];
let pokemonItems = [];
let pokemonMoves = [];
let awsServices = [];
let allPokemonNames = [];
let currentItem = {};
let currentType = '';
let currentScore = 0;
let highScore = 0;

// Common AWS terms to filter out
const awsCommonTerms = [
    'database', 'storage', 'compute', 'network', 'cloud', 'service',
    'management', 'security', 'analytics', 'machine learning', 'container',
    'serverless', 'integration', 'monitoring', 'deployment', 'backup',
    'migration', 'transfer', 'gateway', 'firewall', 'load balancer'
];

// Load data
async function loadData() {
    const pokemonResponse = await fetch('data/pokedex.json');
    pokemonData = await pokemonResponse.json();

    const itemsResponse = await fetch('data/items.json');
    pokemonItems = await itemsResponse.json();

    const movesResponse = await fetch('data/moves.json');
    pokemonMoves = await movesResponse.json();

    const awsResponse = await fetch('data/aws_services.json');
    const awsData = await awsResponse.json();

    // Extract AWS service names
    awsServices = [];
    for (const category in awsData.Services) {
        for (const serviceKey in awsData.Services[category]) {
            const service = awsData.Services[category][serviceKey];
            if (service.Description) {
                awsServices.push(service.Description);
            }
        }
    }

    // Combine all Pokemon names from different sources
    allPokemonNames = [
        ...pokemonData.map(p => p.name.english),
        ...pokemonItems.filter(i => i.name && i.name.english && i.name.english !== 'None').map(i => i.name.english),
        ...pokemonMoves.map(m => m.ename)
    ];

    console.log('Loaded:', {
        pokemon: pokemonData.length,
        items: pokemonItems.filter(i => i.name && i.name.english && i.name.english !== 'None').length,
        moves: pokemonMoves.length,
        total: allPokemonNames.length
    });

    // Load high score from localStorage
    highScore = parseInt(localStorage.getItem('highScore') || '0', 10);
    updateScoreDisplay();

    nextRound();
}

function nextRound() {
    // Randomly choose Pokemon or AWS
    currentType = Math.random() < 0.5 ? 'pokemon' : 'aws';

    if (currentType === 'pokemon') {
        const randomName = allPokemonNames[Math.floor(Math.random() * allPokemonNames.length)];

        // Remove "Poké" and "Poke" (with and without accents) from items
        let cleanName = randomName
            .replace(/\bPoké\b/gi, '')
            .replace(/\bPoke\b/gi, '')
            .replace(/\bPokémon\b/gi, '')
            .replace(/\bPokemon\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        currentItem = {
            name: cleanName.toLowerCase(),
            type: 'pokemon'
        };
    } else {
        const randomAws = awsServices[Math.floor(Math.random() * awsServices.length)];
        // Remove "Amazon " or "AWS " prefix to avoid leaking the answer
        let cleanName = randomAws.replace(/^Amazon\s+/i, '').replace(/^AWS\s+/i, '');

        // Remove " on AWS" or " for AWS" patterns
        cleanName = cleanName.replace(/\s+on\s+AWS/gi, '').replace(/\s+for\s+AWS/gi, '');

        // Remove common AWS terms
        awsCommonTerms.forEach(term => {
            const regex = new RegExp('\\b' + term + '\\b', 'gi');
            cleanName = cleanName.replace(regex, '').trim();
        });

        // Clean up extra spaces and parentheses
        cleanName = cleanName.replace(/\s+/g, ' ').replace(/\(\s*\)/g, '').trim();

        currentItem = {
            name: cleanName.toLowerCase(),
            type: 'aws'
        };
    }

    document.getElementById('pokemonName').textContent = currentItem.name;

    // Clear radio selection
    document.querySelectorAll('input[name="choice"]').forEach(radio => {
        radio.checked = false;
    });
}

function submitGuess() {
    const selected = document.querySelector('input[name="choice"]:checked');

    if (!selected) {
        return;
    }

    const guess = selected.value;
    const correct = guess === currentItem.type;
    const fieldset = document.querySelector('fieldset');

    // Remove any existing animation classes
    fieldset.classList.remove('correct', 'incorrect');

    if (correct) {
        fieldset.classList.add('correct');
        currentScore++;

        // Update high score if necessary
        if (currentScore > highScore) {
            highScore = currentScore;
            localStorage.setItem('highScore', highScore.toString());
        }
    } else {
        fieldset.classList.add('incorrect');
        currentScore = 0;
    }

    updateScoreDisplay();

    // Wait for animation to finish before loading next round
    setTimeout(() => {
        fieldset.classList.remove('correct', 'incorrect');
        nextRound();
    }, 2000);
}

function updateScoreDisplay() {
    document.getElementById('currentScore').textContent = currentScore;
    document.getElementById('highScore').textContent = highScore;
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.key === '1') {
        document.getElementById('aws').checked = true;
    } else if (e.key === '2') {
        document.getElementById('pokemon').checked = true;
    } else if (e.key === 'Enter') {
        submitGuess();
    }
});

// Load data when page loads
loadData();
