let pokemonData = [];
let pokemonItems = [];
let pokemonMoves = [];
let awsServices = [];
let allPokemonNames = [];
let currentItem = {};
let currentType = '';

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

    nextRound();
}

function nextRound() {
    // Randomly choose Pokemon or AWS
    currentType = Math.random() < 0.5 ? 'pokemon' : 'aws';

    if (currentType === 'pokemon') {
        const randomName = allPokemonNames[Math.floor(Math.random() * allPokemonNames.length)];
        currentItem = {
            name: randomName.toLowerCase(),
            type: 'pokemon'
        };
    } else {
        const randomAws = awsServices[Math.floor(Math.random() * awsServices.length)];
        // Remove "Amazon " or "AWS " prefix to avoid leaking the answer
        let cleanName = randomAws.replace(/^Amazon\s+/i, '').replace(/^AWS\s+/i, '');

        // Remove common AWS terms
        awsCommonTerms.forEach(term => {
            const regex = new RegExp('\\b' + term + '\\b', 'gi');
            cleanName = cleanName.replace(regex, '').trim();
        });

        // Clean up extra spaces
        cleanName = cleanName.replace(/\s+/g, ' ').trim();

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
    } else {
        fieldset.classList.add('incorrect');
    }

    // Wait for animation to finish before loading next round
    setTimeout(() => {
        fieldset.classList.remove('correct', 'incorrect');
        nextRound();
    }, 2000);
}

// Load data when page loads
loadData();
