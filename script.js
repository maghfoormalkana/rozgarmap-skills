// ================= THEME TOGGLE =================
const themeToggleBtn = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('rozgarTheme') || 'dark';

if (savedTheme === 'light') {
  document.documentElement.setAttribute('data-theme', 'light');
  if(themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'light') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('rozgarTheme', 'dark');
      themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('rozgarTheme', 'light');
      themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
  });
}

// Ensure execution only on competition page for competition logic
if(document.getElementById('studentName')) {
  const settings = JSON.parse(localStorage.getItem("competitionSettings"));

  if(!settings){
    alert("No competition setup found.");
    window.location.href = "index.html";
  }

  document.getElementById('studentName').textContent = settings.student;

  let time = settings.duration * 60;
  let startTime = Date.now();

  const countdown = document.getElementById('countdown');
  const status = document.getElementById('status');
  const form = document.getElementById('form');
  const accuracyDisplay = document.getElementById('accuracy');
  const inputs = form.querySelectorAll('input, select');

  // ================= TIMER =================
  const timer = setInterval(()=>{
    let m = Math.floor(time/60);
    let s = time%60;
    countdown.textContent = m + ":" + (s<10?"0"+s:s);
    
    calculateSpeed();

    if(time <= 0){
      finishCompetition();
    }
    time--;
  }, 1000);

  // ================= LIVE VALIDATION & UX =================
  inputs.forEach((input, index) => {
    // Real-time speed and validation update
    input.addEventListener('input', (e) => {
      calculateSpeed();
      validateInput(e.target);
    });

    // Auto focus next field on Enter key for speed typing
    input.addEventListener('keypress', (e) => {
      if(e.key === 'Enter') {
        e.preventDefault();
        const nextInput = inputs[index + 1];
        if(nextInput) {
          nextInput.focus();
        } else {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }
    });
  });

  function validateInput(inputEl) {
    if (!masterData[currentIndex]) return;
    const key = inputEl.id;
    const masterVal = String(masterData[currentIndex][key]).trim();
    const currentVal = inputEl.value.trim();

    inputEl.className = ''; // Reset
    if (currentVal === '') {
      return; 
    } else if (currentVal === masterVal) {
      inputEl.classList.add('valid');
    } else if (masterVal.startsWith(currentVal)) {
      inputEl.classList.add('partial');
    } else {
      inputEl.classList.add('invalid');
    }
  }

  // ================= MASTER DATA =================
  let masterData = [];
  let currentIndex = 0;
  let totalCorrect = 0;
  let totalFields = 0;

  // Assuming data structure matches original implementation
  fetch("data/master-data.json")
  .then(res => res.json())
  .then(data => {
    masterData = shuffle([...data]);
    showMasterRow();
  })
  .catch(err => console.log("Waiting for data:", err));

  function shuffle(array){
    for(let i=array.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [array[i],array[j]] = [array[j],array[i]];
    }
    return array;
  }

  function showMasterRow(){
    if(currentIndex >= masterData.length){
      finishCompetition();
      return;
    }
    const row = masterData[currentIndex];
    document.getElementById("masterRow").innerText =
      `${row.firstName}  -  ${row.lastName}  -  ${row.gender}  -  ${row.contact}  -  ${row.email}  -  ${row.address}  -  ${row.city}  -  ${row.state}  -  ${row.pincode}`;
  }

  // ================= PREVENT COPY =================
  document.addEventListener("copy", e=>e.preventDefault());
  document.addEventListener("contextmenu", e=>e.preventDefault());

  // ================= DATA + SCORING =================
  let data = [];
  let submittedChars = 0; 
  const tableBody = document.getElementById('tableBody');
  const totalEntries = document.getElementById('totalEntries');
  const speedDisplay = document.getElementById('speed');

  form.addEventListener('submit', e=>{
    e.preventDefault();

    if(time <= 0 || currentIndex >= masterData.length) return;

    const entry = {};
    inputs.forEach(input => {
      entry[input.id] = input.value.trim();
    });

    const master = masterData[currentIndex];
    let fields = Object.keys(master);

    fields.forEach(key=>{
      totalFields++;
      if(entry[key] === String(master[key]).trim()){
        totalCorrect++;
      }
    });

    submittedChars += Object.values(entry).join('').length;

    const overallAccuracy = Math.round((totalCorrect / totalFields) * 100);
    accuracyDisplay.textContent = overallAccuracy + "%";

    data.push(entry);
    render();

    currentIndex++;          
    showMasterRow();         
    
    form.reset();
    inputs.forEach(input => input.className = ''); // Clear validation styling
    inputs[0].focus(); // Focus first name
  });

  function render(){
    tableBody.innerHTML='';
    data.forEach(d=>{
      tableBody.innerHTML+=`
        <tr>
          <td>${d.firstName}</td><td>${d.lastName}</td><td>${d.gender}</td>
          <td>${d.contact}</td><td>${d.email}</td><td>${d.address}</td>
          <td>${d.city}</td><td>${d.state}</td><td>${d.pincode}</td>
        </tr>`;
    });
    totalEntries.textContent = data.length;
  }

  function calculateSpeed(){
    let minutes = (Date.now() - startTime) / 60000;
    if(minutes > 0.05){ 
      let currentActiveChars = 0;
      inputs.forEach(input => currentActiveChars += (input.value || '').length);

      let totalCharsTyped = submittedChars + currentActiveChars;
      let wpm = Math.round((totalCharsTyped / 5) / minutes);
      speedDisplay.textContent = wpm + " WPM";
    }
  }

  function finishCompetition(){
    clearInterval(timer);
    document.getElementById('timeOver').style.display='block';
    form.classList.add('locked');
    status.textContent = 'Completed';
    status.style.color = 'var(--accent)';
    
    calculateSpeed();
    
    document.getElementById('modalStudent').textContent = settings.student;
    document.getElementById('modalEntries').textContent = data.length;
    document.getElementById('modalSpeed').textContent = speedDisplay.textContent;
    document.getElementById('modalAccuracy').textContent = accuracyDisplay.textContent;
    
    document.getElementById('resultModal').classList.add('active');
  }
}

function resetAll(){
  if(confirm('Reset entire batch?')){
    localStorage.removeItem("competitionSettings");
    window.location.href = "index.html";
  }
}