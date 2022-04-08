// Some actually constant consts
const cols = "ABCDEF";
const MIDDLE = 0;
const EDGE = 1;
const CORNER = 2;
const styles = ["letter", "edge", "corner"];

//TODO: Move this into Tile?
const game = document.querySelector('.game');
const wordList = document.querySelector('.wordList');
const wordCount = document.querySelector('.wordCount');

console.log('Reading dictionary...');

// Populate our dictionary
let dictionary = [];
fetch('./3of6game.txt')
  .then(response => response.text())
  .then(text => dictionary = text.split('\r\n'))
  .catch(error => console.log(error));
  
// Define our letter frequencies
const letter_freqs = [
    { letter: 'a', weight: 0.08167 },
    { letter: 'b', weight: 0.01492 },
    { letter: 'c', weight: 0.02782 },
    { letter: 'd', weight: 0.04253 },
    { letter: 'e', weight: 0.12702 },
    { letter: 'f', weight: 0.02228 },
    { letter: 'g', weight: 0.02015 },
    { letter: 'h', weight: 0.06094 },
    { letter: 'i', weight: 0.06966 },
    { letter: 'j', weight: 0.00153 },
    { letter: 'k', weight: 0.00772 },
    { letter: 'l', weight: 0.04025 },
    { letter: 'm', weight: 0.02406 },
    { letter: 'n', weight: 0.06749 },
    { letter: 'o', weight: 0.07507 },
    { letter: 'p', weight: 0.01929 },
    { letter: 'q', weight: 0.00095 },
    { letter: 'r', weight: 0.05987 },
    { letter: 's', weight: 0.06327 },
    { letter: 't', weight: 0.09056 },
    { letter: 'u', weight: 0.02758 },
    { letter: 'v', weight: 0.00978 },
    { letter: 'w', weight: 0.0236  },
    { letter: 'x', weight: 0.0015  },
    { letter: 'y', weight: 0.01974 },
    { letter: 'z', weight: 0.00074 }
];

// Generate a random letter according to the above frequencies
function randomLetter() {
  let random_weight = Math.random();
  
  const { letter } = letter_freqs.find(
    ({ weight }) => (random_weight -= weight) < 0
  );

  return letter;
}

// Return the location type of a tile based on coords
function loc(row, col) {
        if (row > 0 && row < 5) {
            if (col > 0 && col < 5)
                return MIDDLE;
            else
                return EDGE;
        }
        else {
            if (col > 0 && col < 5)
                return EDGE;
            else
                return CORNER;
        }
}

class Tile {
    constructor(row, col, setActive, shiftTiles, selectTile) {
        const l = loc(row, col);
        this.row = row;
        this.col = col;
        
        // Binds are necessary to have consistent event callbacks to remove
        this.dragEnd = this.onDragEnd.bind(this);
        this.dragOver = this.onDragOver.bind(this);
        this.drop = this.onDrop.bind(this);
        this.click = this.onClick.bind(this);
        
        // Create the element with id, and init if 
        this.element = document.createElement('span');
        this.element.setAttribute('id', `${cols[col]}${row}`);
        
        // Initialize edges, middle, and active tile
        this.emptyBorder(l);
        if (l === MIDDLE) {
            // Middle tile - generate a random letter
            const c = this.element.innerHTML = randomLetter();
            this.element.setAttribute('class', 'letter');
            
            this.highlighted = false;
            this.selectTile = selectTile;
            this.element.addEventListener('click', this.click);
        }
        else {
            // These two are distinct functions so the receiving tile can set the coords for the shift, and then the original active tile can call the shift after it cleans itself up
            this.setActive = setActive;
            this.shiftTiles = shiftTiles;
        }    
        if (row === 1 && col === 0) {
            // Our starting active tile
            const c = randomLetter();
            this.activeTile(c);
        }
        
        // Add the tile to the DOM
        game.appendChild(this.element);
    }
    
    emptyBorder(l) {
        if (l === EDGE) {
            // Make it empty, undraggable, and edge styled
            this.element.innerHTML = '';
            this.element.setAttribute('draggable', false);
            this.element.setAttribute('class', styles[l]);
            this.element.removeEventListener('dragstart', this.dragStart);
            this.element.removeEventListener('dragend', this.dragEnd);
            
            // Add the listeners that allow drag&drop on here
            this.element.addEventListener('dragenter', this.dragOver);
            this.element.addEventListener('dragover', this.dragOver);
            this.element.addEventListener('drop', this.drop);
        }
    }
    
    activeTile(c) {
        this.element.innerHTML = c;
        this.element.setAttribute('class', 'letter');
        this.element.setAttribute('draggable', true);
        this.element.removeEventListener('dragenter', this.dragOver);
        this.element.removeEventListener('dragover', this.dragOver);
        this.element.removeEventListener('drop', this.drop);
        this.element.addEventListener('dragstart', this.dragStart);
        this.element.addEventListener('dragend', this.dragEnd);
    }
    
    // This function needs no reference for the tile, so it has no bind
    dragStart(e) {
        e.dataTransfer.setData('string', e.target.innerHTML);
    }
    
    onDragEnd(e) {
        if (e.dataTransfer.dropEffect === 'move') {
            this.emptyBorder(loc(this.row, this.col));
            this.shiftTiles();
        }
    }
    
    onDragOver(e) {
        e.preventDefault();
    }
    
    onDrop(e) {
        e.preventDefault();
        this.activeTile(e.dataTransfer.getData('string'));
        this.setActive(this.row, this.col);
    }
    
    onClick(e) {
        e.stopPropagation();
        if (this.selectTile(this.element.innerHTML, this.row, this.col)) {
            this.highlighted = !this.highlighted;
            this.element.classList.toggle('highlighted');
        }
    }
}



const tiles = [];
let active_row = 1;
let active_col = 0;
let word = '';
let word_coords = [];
const found_words = [];
let score = 0;

// Populate the whole grid, add style, and generate a letter for each of the middle tiles
for (row=0;row<6;row++) {
    const tile_row = [];
    for (col=0;col<6;col++) {
        const l = loc(row, col);
        const tile = new Tile(row, col, setActive, shiftTiles, selectTile);
        tile_row.push(tile);
    }
    tiles.push(tile_row);
}

function addTile(c, row, col) {
    word_coords.push([row, col]);
    word += c;
    document.querySelector('.wordButton').innerHTML = word;
}

// Add or remove the selected tile to or from the chain
function selectTile(c, row, col) {
    const len = word_coords.length;
    if (len) {
        prow = word_coords[len-1][0];
        pcol = word_coords[len-1][1];
        if (prow === row && pcol === col) {
            word_coords.pop();
            word = word.slice(0, -1);
            document.querySelector('.wordButton').innerHTML = word;
            return true;
        }
        else if (Math.abs(prow-row) < 2 && Math.abs(pcol-col) < 2) {
            if (JSON.stringify(word_coords).indexOf(JSON.stringify([row, col])) === -1) {
                addTile(c, row, col);
                return true;
            }
        }
    }
    else {
        addTile(c, row, col);
        return true;
    }
    return false;
}

// Clear the word button and take the letters off the chain
function clearWord() {
    word_coords = [];
    word = '';
    for (row=0;row<6;row++) {
        for (col=0;col<6;col++) {
            tiles[row][col].element.classList.remove('highlighted');
        }
    }
    document.querySelector('.wordButton').innerHTML = word;
}
document.querySelector('.cancelButton').addEventListener('click', clearWord);

// Check if the word in the button is in the dictionary
function checkWord() {
    if (word.length > 2) {
        console.log(`checkWord: ${word}`);
        console.log(dictionary.includes(word));
        if (dictionary.includes(word) &&
            !found_words.includes(word)) {
            new_word = document.createElement('span');
            new_word.setAttribute('class', 'foundWord');
            new_word.innerHTML = word;
            wordList.appendChild(new_word);
            found_words.push(word);
            clearWord();
            score++;
            wordCount.innerHTML = score;
        }
    }
}
document.querySelector('.wordButton').addEventListener('click', checkWord);

// Shift the active tile's row or column, putting it in the middle and creating a new active tile
function shiftTiles() {
    if (word_coords.length === 0) {
        const row = active_row;
        const col = active_col;
        
        //TODO: Get rid of redundancy, maybe using a filter
        if (row === 0) {
            tiles[5][col].activeTile(tiles[4][col].element.innerHTML);
            for (r=4;r>0;r--) {
                tiles[r][col].element.innerHTML = tiles[r-1][col].element.innerHTML;
            }
            tiles[0][col].emptyBorder(EDGE);
        }
        else if (row === 5) {
            tiles[0][col].activeTile(tiles[1][col].element.innerHTML);
            for (r=1;r<5;r++) {
                tiles[r][col].element.innerHTML = tiles[r+1][col].element.innerHTML;
            }
            tiles[5][col].emptyBorder(EDGE);
        }
        else if (col === 0) {
            tiles[row][5].activeTile(tiles[row][4].element.innerHTML);
            for (c=4;c>0;c--) {
                tiles[row][c].element.innerHTML = tiles[row][c-1].element.innerHTML;
            }
            tiles[row][0].emptyBorder(EDGE);
        }
        else if (col === 5) {
            tiles[row][0].activeTile(tiles[row][1].element.innerHTML);
            for (c=1;c<5;c++) {
                tiles[row][c].element.innerHTML = tiles[row][c+1].element.innerHTML;
            }
            tiles[row][5].emptyBorder(EDGE);
        }
    }
}

// Let the main function know where the active tile is
function setActive(row, col) {
    active_row = row;
    active_col = col;
}


function mainLoop() {
    
}





