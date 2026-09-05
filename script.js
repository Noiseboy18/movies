const API_KEY = '5b8edad118bea8230b69570041b6e579';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const IMG_PLACEHOLDER = 'https://via.placeholder.com/200x300?text=No+Image';


const container = document.querySelector('.movies-grid')
const form = document.querySelector('.search-form')
const searchInput = document.querySelector('.search-inp')
const toggleBtn = document.querySelector('.btn-watchlist-toggle')
const counter = document.querySelector('.watchlist-counter')
const sectionTitle = document.querySelector('.section-title')
const pagination = document.querySelector('.pagination')
const modal = document.querySelector('.modal');
const modalBody = document.querySelector('.modal_body');
const modalClose = document.querySelector('.modal_close');
const modalOverlay = document.querySelector('.modal_overlay');



let watchlist = JSON.parse(localStorage.getItem('watchlist'))|| []
let currentMovies = []
let currentMode = 'browse'
let currentPage = 1
let currentQuery = ""
let totalPages = 1



async function fetchMovies(url){
    const result = await fetch(url)
    if (!result.ok) {
        throw new Error(`Помилка сервера: ${result.status}`)
    }
    const data =  await result.json()


    return data
    

}

function formatRuntime(minutes) {
  if (!minutes) return 'Невідомо';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} год ${mins} хв`;
}

function showLoading(){
    container.innerHTML =  '<p class="status">Завантаження...</p>'
}
function showEmpty(){
    container.innerHTML =  '<p class="status">Нічого не знайдено</p>'
}

function showError(message) {
    container.innerHTML =  `<p class="status status--error">${message}</p>`
}

function  openModal(){
    modal.classList.remove('hidden')
    document.body.style.overflow = 'hidden'
}
function  closeModal(){
    modal.classList.add('hidden')
    modalBody.innerHTML = ''
    document.body.style.overflow = ''
}

function renderMovies(movies){
    currentMovies = movies
    if(movies.length == 0){
        if(currentMode == 'watchlist'){
        container.innerHTML = `
        <div class="empty-watchlist">
          <p>Ваш список порожній</p>
          <p>Натисніть «+ Хочу подивитись» на картці фільму, щоб додати його сюди</p>
        </div>
      `
        }else{
            showEmpty()
        }
       return
    }



    let tags = movies.map((movie)=>{
        let poster = movie.poster_path ? IMG_BASE + movie.poster_path: IMG_PLACEHOLDER
        let year =  movie.release_date ? movie.release_date.slice(0, 4): 'Рік невідомий'
        let rating =  movie.vote_average ? movie.vote_average.toFixed(1): 'Невідомий'
        return `<div class="movie-card" data-id="${movie.id}">
                <img class="movie-card__poster" src="${poster}" alt="${movie.title}">
                <div class="movie-card__info">
                <h3 class="movie-card__title">${movie.title}</h3>
                <div class="movie-card__meta">
                    <span class="movie-card__year">${year}</span>
                    <span class="movie-card__rating">⭐ ${rating}</span>
                </div>
                <button class = "btn-watchlist ${isInWatchlist(movie.id) ? 'btn-watchlist--active' : ''}">
                    ${isInWatchlist(movie.id) ? 'У списку' : 'Хочу подивитися'}
                </button>
                </div>
         </div>`

        
        })
     

        container.innerHTML = tags.join('')


}

function renderPagination(){
    if (currentMode == 'watchlist' || totalPages <= 1){
        pagination.innerHTML = ''
        return
    }
    const maxPage = Math.min(totalPages, 500)
    pagination.innerHTML = `
        <button class = "page-btn" data-page="${currentPage-1}" ${currentPage == 1 ? 'disabled' : ''}>← </button>
        <span class = "page-info">Сторінка ${currentPage} з ${maxPage}</span>
        <button class = "page-btn" data-page="${currentPage+1}" ${currentPage == maxPage ? 'disabled' : ''}> →</button>
     `
}

 async function getPopular(page=1){
    showLoading()
    currentQuery = ""
    currentPage = page
    try {
        const link =   `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=uk-UA&page=${page}`;
        const films =  await fetchMovies(link)
        console.log(films)
        totalPages = films.total_pages
        renderMovies(films.results)
        renderPagination()
    }catch (error){
        showError('Помилка при завантаженні')

    }
}

 async function searchMovies(search, page=1){
    showLoading()
    currentQuery = search
    currentPage = page
    currentMode = 'browse'
    try {
        let link =  `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(search)}&language=uk-UA&page=${page}`
        let films = await fetchMovies(link)
        totalPages = films.total_pages
        renderMovies(films.results)
        renderPagination()
    }catch (error){
        showError('Помилка при завантаженні')

    }
}


function saveWatchlist(){
    localStorage.setItem('watchlist', JSON.stringify(watchlist))

}

function isInWatchlist(movieId){
    return watchlist.some((movie)=>movie.id === movieId)
}



function toggleWatchlist(movie){
    if(isInWatchlist(movie.id)){
        watchlist = watchlist.filter((m)=>{
            return m.id !== movie.id
        })
    } else{
        watchlist.push(movie)

    }
    saveWatchlist()
    updateCounter()
}


function updateCounter(){
    counter.innerHTML = watchlist.length
}




form.addEventListener('submit', (e)=>{
    e.preventDefault()
    let query = searchInput.value.trim()
    if(!query){
        return
    }
    searchMovies(query)
})


container.addEventListener('click', (e)=>{
    const btn = e.target.closest('.btn-watchlist')
    console.log(btn)
    if(!btn) return

    const card = btn.closest('.movie-card')
    const movieId = +card.dataset.id

    const movie = currentMovies.find((m)=>{
        return m.id === movieId
    })|| watchlist.find((m)=> {
        return m.id === movieId
    })
    
    if(!movie) return

    toggleWatchlist(movie)
    renderMovies(currentMovies)
    

})


toggleBtn.addEventListener('click', ()=>{
    if(currentMode == 'watchlist'){
        currentMode = 'browse'
        sectionTitle.innerHTML = 'Популярні фільми'
        toggleBtn.innerHTML = `Мій список: <span class="watchlist-counter">${watchlist.length}</span>`
    }else{
        currentMode = 'watchlist'
        sectionTitle.innerHTML = 'Мій список'
        renderMovies(watchlist)
    }
})


pagination.addEventListener('click', (e) =>{
    let btn = e.target.closest('.page-btn')
    if (!btn) return

    const page = +btn.dataset.page

    if (currentQuery) {
        searchMovies(currentQuery, page)

    }   else{
        getPopular(page)

    }
    window.scrollTo({top:0, behavior: 'smooth'})

})


modalClose.addEventListener('click', closeModal)
modalOverlay.addEventListener('click', closeModal)
document.addEventListener('keydown', (e)=>{
    if (e.key == 'Escape'){
        closeModal()
    }

})
getPopular()
updateCounter()


