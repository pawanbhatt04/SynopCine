const sendButton = document.getElementById('send-btn');
const setupTextarea = document.getElementById('setup-textarea');
const movieBossText = document.getElementById('movie-boss-text');
if(sendButton)
sendButton.addEventListener('click', async () => {
  movieBossText.innerHTML = `<img src="images/loading.svg" class="loading" id="loading">`;
  movieBossText.innerText = `Ok, just wait a second while my digital brain digests that...`;
  
});

let title = document.querySelector('#output-title').innerText;
if(title){
  const setupInputContainer = document.getElementById('setup-input-container')
    setupInputContainer.innerHTML = `<div id="view-pitch-btn" class="view-pitch-btn">View Pitch</div>`
    document.getElementById('output-container').style.display = 'none';
    console.log("hi man");
  document.getElementById('view-pitch-btn').addEventListener('click', ()=>{
    document.getElementById('setup-container').style.display = 'none'
    document.getElementById('output-container').style.display = 'flex'
    document.getElementById('output-container').style.maxWidth = '60%'
    movieBossText.innerText = `This idea is so good I'm jealous! It's gonna make you rich for sure! Remember, I want 10% 💰`
  });
}
