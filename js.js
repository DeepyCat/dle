const SUPABASE_URL = 'https://lhthnrgmxxvngmggqllc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ksCxhs8SKCcnoPkeN3aH7g_Pu5ZVJ1D';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const input = document.getElementById('guessInput');
const suggestionsList = document.getElementById('suggestions');
let secretCharacter = null;

// Galerie
async function loadGallery() {
    const { data } = await client.from('charakters').select('name, img');
    
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
    const { data } = await client.from('charakters').select('id');
    if (!data || data.length === 0) return;
    const now = new Date();
    const today = now.getUTCFullYear() + '-' + (now.getUTCMonth() + 1) + '-' + now.getUTCDate();
    let hash = 0;
    for (let i = 0; i < today.length; i++) hash = today.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % data.length;
    const { data: characterData } = await client.from('charakters').select('*').eq('id', data[index].id).single();
    secretCharacter = characterData;
}
loadSecretCharacter();

// Hádání
input.addEventListener('input', async () => {
  const query = input.value.trim();
  if (query.length < 1) { suggestionsList.innerHTML = ''; return; }
  const { data } = await client.from('charakters').select('name, img').ilike('name', `%${query}%`).limit(5);
  suggestionsList.innerHTML = '';
  if (data) {
    data.forEach(item => {
      const li = document.createElement('li');
      const img = document.createElement('img');
      img.src = item.img; img.style.width = '30px'; img.style.height = '30px'; img.style.borderRadius = '50%'; img.style.marginRight = '10px';
      li.appendChild(img); li.append(item.name);
      li.onclick = () => { input.value = item.name; suggestionsList.innerHTML = ''; };
      suggestionsList.appendChild(li);
    });
  }
});

async function checkGuess() {
    if (!secretCharacter) return;
    const { data } = await client.from('charakters').select('*').ilike('name', input.value.trim()).maybeSingle();
    if (!data) { alert("Postava nenalezena!"); return; }
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
    if (data.name === secretCharacter.name) alert("Gratuluji, uhodl jsi!");
}
document.getElementById('guessBtn').addEventListener('click', checkGuess);