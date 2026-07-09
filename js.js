const SUPABASE_URL = 'https://lhthnrgmxxvngmggqllc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ksCxhs8SKCcnoPkeN3aH7g_Pu5ZVJ1D';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const TABLE_NAME = window.TABLE_NAME || 'rezero';

const input = document.getElementById('guessInput');
const suggestionsList = document.getElementById('suggestions');
let secretCharacter = null;
let attempts = 0;

let isEndless = false;


//Galery
async function loadGallery() {
    const { data } = await client.from(TABLE_NAME).select('name, img');
    if (data) {
        data.sort((a, b) => a.name.localeCompare(b.name));
        const galleryContent = document.getElementById('galleryContent');
        data.forEach(char => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.innerHTML = `<img src="${char.img}"> <span>${char.name}</span>`;
            galleryContent.appendChild(div);
        });
    }
}
loadGallery();

document.getElementById('openGalleryBtn').onclick = () => document.getElementById('sideGallery').classList.add('open');
document.getElementById('closeGalleryBtn').onclick = () => document.getElementById('sideGallery').classList.remove('open');
// Daily
async function loadSecretCharacter() {
    const { data } = await client.from(TABLE_NAME).select('id');
    if (!data || data.length === 0) return;

    const now = new Date();
    const today = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();

    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        hash = today.charCodeAt(i) + ((hash << 5) - hash);
    }

    let seededRandom = Math.abs(hash);
    function random() {
        seededRandom = (seededRandom * 9301 + 49297) % 233280;
        return seededRandom / 233280;
    }

    const index = Math.floor(random() * data.length);
    const { data: characterData } = await client.from(TABLE_NAME).select('*').eq('id', data[index].id).single();
    secretCharacter = characterData;
    resetHint();
}

// mode swithc
document.getElementById('endlessBtn').addEventListener('click', () => {
    isEndless = !isEndless;
    document.getElementById('endlessBtn').innerText = `Endless Mode: ${isEndless ? 'ON' : 'OFF'}`;
    if (isEndless) loadRandomCharacter(); 
});

//endless mode
async function loadRandomCharacter() {
    const { data } = await client.from(TABLE_NAME).select('id');
    if (!data || data.length === 0) return;
    
    const randomId = data[Math.floor(Math.random() * data.length)].id;
    const { data: characterData } = await client.from(TABLE_NAME).select('*').eq('id', randomId).single();
    secretCharacter = characterData;
    resetHint();
    
    document.getElementById('gameBoard').innerHTML = '';
    attempts = 0;
    document.getElementById('attemptCount').innerText = attempts;
    input.disabled = false;
    document.getElementById('guessBtn').disabled = false;
}

// Timer
function updateTimer() {
    const now = new Date();
    
    
    const nextMidnight = new Date();
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);
    
    const diff = nextMidnight - now;
    
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    const timerDisplay = [h, m, s]
        .map(v => v.toString().padStart(2, '0'))
        .join(':');
        
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.innerText = timerDisplay;
    }
}
loadSecretCharacter();
setInterval(updateTimer, 1000);
updateTimer();

// clicl and search
async function performSearch() {
    const query = input.value.trim();
    if (query.length === 0) {
        suggestionsList.innerHTML = '';
        return;
    }

    const { data } = await client.from(TABLE_NAME).select('name, img').ilike('name', `%${query}%`).limit(5);
    suggestionsList.innerHTML = '';

    if (data) {
        data.forEach(item => {
            const li = document.createElement('li');
            const img = document.createElement('img');
            img.src = item.img;
            img.style.width = '30px'; img.style.height = '30px'; img.style.borderRadius = '50%'; img.style.marginRight = '10px';
            li.appendChild(img);
            li.append(item.name);
            li.onclick = (e) => {
                e.stopPropagation();
                input.value = item.name;
                suggestionsList.innerHTML = '';
            };
            suggestionsList.appendChild(li);
        });
    }
}


input.addEventListener('input', performSearch);


input.addEventListener('click', performSearch);


document.addEventListener('click', (e) => {
    if (e.target !== input) {
        suggestionsList.innerHTML = '';
    }
});

// Fih 
input.addEventListener('input', async () => {
    const query = input.value.trim();
    if (query.length === 0) { 
        suggestionsList.innerHTML = ''; 
        return; 
    }

    const { data } = await client.from(TABLE_NAME).select('name, img').ilike('name', `%${query}%`).limit(5);
    
    
    suggestionsList.innerHTML = '';

    if (data) {
        data.forEach(item => {
            const li = document.createElement('li');
            const img = document.createElement('img');
            img.src = item.img; 
            img.style.width = '30px'; 
            img.style.height = '30px'; 
            img.style.borderRadius = '50%'; 
            img.style.marginRight = '10px';
            
            li.appendChild(img); 
            li.append(item.name);
            
            // TADY je ta klíčová akce:
            li.onclick = (e) => { 
                e.stopPropagation(); // Zastaví šíření eventu, aby se seznam hned znovu neotevřel
                input.value = item.name; 
                suggestionsList.innerHTML = ''; // Seznam zmizí okamžitě
            };
            
            suggestionsList.appendChild(li);
        });
    }
});


document.addEventListener('click', (e) => {
    if (e.target !== input) {
        suggestionsList.innerHTML = '';
    }
});
//hint
document.getElementById('hintBtn').addEventListener('click', () => {
    if (!secretCharacter) return;

    const hintDisplay = document.getElementById('hintDisplay');
    
    
    if (!secretCharacter.hint) {
        hintDisplay.innerText = "No hint available for this character.";
    } else {
        hintDisplay.innerText = `Hint: ${secretCharacter.hint}`;
    }

    
    document.getElementById('hintBtn').disabled = true;
    document.getElementById('hintBtn').style.opacity = '0.5';
});
//hint restart
function resetHint() {
    const hintBtn = document.getElementById('hintBtn');
    const hintDisplay = document.getElementById('hintDisplay');
    
    hintBtn.disabled = false;     
    hintBtn.style.opacity = '1';  
    hintDisplay.innerText = '';   
}
// Main
async function checkGuess() {
    if (!secretCharacter) return;
    const { data } = await client.from(TABLE_NAME).select('*').ilike('name', input.value.trim()).maybeSingle();
    if (!data) { alert("Postava nenalezena!"); return; }

    if (data.name === secretCharacter.name) {
        
        if (isEndless) {
            setTimeout(() => {
               
                loadRandomCharacter();
            }, 1000);
        } else {
            document.getElementById('winPopup').style.display = 'flex';
            
        }
    }
    
    attempts++;
    document.getElementById('attemptCount').innerText = attempts;

    const attemptRow = document.createElement('div');
    attemptRow.className = 'attempt-row';
    const imgBox = document.createElement('div');
    imgBox.className = 'box';
    const img = document.createElement('img');
    img.src = data.img; img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'cover'; img.style.borderRadius = '8px';
    imgBox.appendChild(img); attemptRow.appendChild(imgBox);
    
    const attrs = [
        { key: 'name', label: 'Name' }, { key: 'gender', label: 'Gender' }, { key: 'role', label: 'Role' },
        { key: 'race', label: 'Race' }, { key: 'age', label: 'Age' }, { key: 'hair_color', label: 'Hair' },
        { key: 'eye_color', label: 'Eyes' }, { key: 'affiliation', label: 'Affiliation' }, { key: 'arc', label: 'Arc' }
    ];
    
    attrs.forEach(attr => {
        const val = data[attr.key];
        const isCorrect = (val === secretCharacter[attr.key]);
        const div = document.createElement('div');
        div.className = `box ${isCorrect ? 'green' : 'red'}`;
        let content = val;
        if (!isCorrect && (attr.key === 'age' || attr.key === 'arc') && !isNaN(val) && !isNaN(secretCharacter[attr.key])) {
             content += (parseInt(val) < parseInt(secretCharacter[attr.key]) ? " ⬆" : " ⬇");
        }
        div.innerText = content;
        attemptRow.appendChild(div);
    });
    
    document.getElementById('gameBoard').prepend(attemptRow);
    input.value = '';

    if (data.name === secretCharacter.name) {
        document.getElementById('winPopup').style.display = 'flex';
        document.getElementById('winMessage').innerText = `🎉 Hell yeah ${attempts}. tries! 🎉`;
        input.disabled = true;
        document.getElementById('guessBtn').disabled = true;
    }
}

function closePopup() {
    document.getElementById('winPopup').style.display = 'none';
}

document.getElementById('guessBtn').addEventListener('click', checkGuess);
