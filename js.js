const SUPABASE_URL = 'https://lhthnrgmxxvngmggqllc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ksCxhs8SKCcnoPkeN3aH7g_Pu5ZVJ1D';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const input = document.getElementById('guessInput');
const suggestionsList = document.getElementById('suggestions');
let secretCharacter = null;

async function loadSecretCharacter() {
    const { data } = await client.from('charakters').select('id');
    if (!data || data.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        hash = today.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % data.length;
    const { data: characterData } = await client.from('charakters').select('*').eq('id', data[index].id).single();
    
    secretCharacter = characterData;
    console.log("Dnešní postava:", secretCharacter.name);
}
loadSecretCharacter();

input.addEventListener('input', async () => {
  const query = input.value.trim();
  if (query.length < 2) { suggestionsList.innerHTML = ''; return; }

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
    const { data } = await client.from('charakters').select('*').ilike('name', input.value.trim()).maybeSingle();
    if (!data) { alert("Postava nenalezena!"); return; }

    const attemptRow = document.createElement('div');
    attemptRow.className = 'attempt-row'; 
    const attrs = [
        { key: 'name', label: 'Jméno' }, { key: 'gender', label: 'Pohlaví' },
        { key: 'race', label: 'Rasa' }, { key: 'age', label: 'Věk' },
        { key: 'hair_color', label: 'Vlasy' }, { key: 'eye_color', label: 'Oči' },
        { key: 'affiliation', label: 'Affiliation' }, { key: 'arc', label: 'Arc' }
    ];

    attrs.forEach(attr => {
        const val = data[attr.key];
        const isCorrect = (val === secretCharacter[attr.key]);
        const div = document.createElement('div');
        div.className = `box ${isCorrect ? 'green' : 'red'}`;
        div.innerText = val + (!isCorrect && typeof val === 'number' ? (val < secretCharacter[attr.key] ? " ⬆️" : " ⬇️") : "");
        attemptRow.appendChild(div);
    });

    document.getElementById('gameBoard').prepend(attemptRow);
    input.value = '';
   
}

document.getElementById('guessBtn').addEventListener('click', checkGuess);