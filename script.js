// Some game parameters
const SHIFT_COST = 10;      // How much your score goes down by
const MIN_WORD_LENGTH = 3;  // How long the smallest word can be

// Some actually constant consts
const cols = "ABCDEF";
const MIDDLE = 0;
const EDGE = 1;
const CORNER = 2;
const styles = ["letter", "edge", "corner"];
const game = document.querySelector('.game');
const wordList = document.querySelector('.wordList');
const wordCount = document.querySelector('.wordCount');
const helpBox = document.querySelector('.helpBox');
const helpButton = document.querySelector('.helpButton');

// Seeded random number generator by David bau
const date = new Date();
const dateString = '' + date.getFullYear() +
                   '-' + date.getMonth() +
                   '-' + date.getDate();
const rng = new Math.seedrandom(dateString);

// Populate our dictionary
var dictionary = [];
fetch('./3of6game.txt')
  .then(response => response.text())
  .then(text => dictionary = text.split(/\r?\n/))
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
  let random_weight = rng();
  
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
        
        // Create the element with id
        this.element = document.createElement('span');
        this.element.setAttribute('id', `${cols[col]}${row}`);
        
        // Add the animation end listeners
        this.element.addEventListener('animationend', () => {
            this.element.classList.remove('letterDownShift');
            this.element.classList.remove('letterUpShift');
            this.element.classList.remove('letterLeftShift');
            this.element.classList.remove('letterRightShift');
        });
        
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
    wlen = word.length
    if (wlen >= Math.max(MIN_WORD_LENGTH, 1)) {
        if (!found_words.includes(word)) {
            if (dictionary.includes(word)) {
                new_word = document.createElement('span');
                new_word.setAttribute('class', 'foundWord');
                new_word.setAttribute('id', `${word}-word`);
                new_word.addEventListener('animationend', () => {
                    already_found.classList.remove('alreadyFoundWord');
                });
                new_word.innerHTML = word;
                wordList.appendChild(new_word);
                found_words.push(word);
                score += wlen;
                wordCount.innerHTML = score;
                
                // A fun little score animation!
                scoreIncrease = document.createElement('div');
                scoreIncrease.setAttribute('class', 'scoreIncrease');
                scoreIncrease.addEventListener('animationend', () => {
                    scoreIncrease.remove(); 
                });
                scoreIncrease.innerHTML = '+' + wlen;
                document.body.appendChild(scoreIncrease);
                
                
                clearWord();
            }
        }
        else {
            already_found = document.getElementById(`${word}-word`);
            already_found.classList.add('alreadyFoundWord');
        }
    }
}
document.querySelector('.wordButton').addEventListener('click', checkWord);

// Shift the active tile's row or column, putting it in the middle and creating a new active tile
function shiftTiles() {
    if (word_coords.length === 0 && score >= SHIFT_COST) {
        const row = active_row;
        const col = active_col;
        
        //TODO: Get rid of redundancy, maybe using a filter
        if (row === 0) {
            tiles[5][col].activeTile(tiles[4][col].element.innerHTML);
            tiles[5][col].element.classList.add('letterDownShift');
            for (r=4;r>0;r--) {
                tiles[r][col].element.innerHTML = tiles[r-1][col].element.innerHTML;
                tiles[r][col].element.classList.add('class', 'letterDownShift');
            }
            tiles[0][col].emptyBorder(EDGE);
        }
        else if (row === 5) {
            tiles[0][col].activeTile(tiles[1][col].element.innerHTML);
            tiles[0][col].element.classList.add('letterUpShift');
            for (r=1;r<5;r++) {
                tiles[r][col].element.innerHTML = tiles[r+1][col].element.innerHTML;
                tiles[r][col].element.classList.add('class', 'letterUpShift');
            }
            tiles[5][col].emptyBorder(EDGE);
            
        }
        else if (col === 0) {
            tiles[row][5].activeTile(tiles[row][4].element.innerHTML);
            tiles[row][5].element.classList.add('letterRightShift');
            for (c=4;c>0;c--) {
                tiles[row][c].element.innerHTML = tiles[row][c-1].element.innerHTML;
                tiles[row][c].element.classList.add('class', 'letterRightShift');
            }
            tiles[row][0].emptyBorder(EDGE);
        }
        else if (col === 5) {
            tiles[row][0].activeTile(tiles[row][1].element.innerHTML);
            tiles[row][0].element.classList.add('letterLeftShift');
            for (c=1;c<5;c++) {
                tiles[row][c].element.innerHTML = tiles[row][c+1].element.innerHTML;
                tiles[row][c].element.classList.add('class', 'letterLeftShift');
            }
            tiles[row][5].emptyBorder(EDGE);
        }
    }
    score -= SHIFT_COST;
    if (score < 0)
        score = 0;
    wordCount.innerHTML = score;
}

// Let the main function know where the active tile is
function setActive(row, col) {
    active_row = row;
    active_col = col;
}

// Add the score animation
wordCountPos = wordCount.getBoundingClientRect();
startLeft = wordCountPos.left + 40;
startTop = wordCountPos.top - 40;
endTop = parseInt(startTop/2);
const css = window.document.styleSheets[0];
css.insertRule(`
@keyframes floatUp {
  0% {
    left: ${startLeft}px;
    top: ${startTop}px;
    color: greenyellow;
  }
  100% {
    left: ${startLeft}px;
    top: ${endTop}px;
    color: rgb(64, 64, 64, 0);
  }
}
`, css.cssRules.length);

// Add the help box
helpText = document.createElement('span');
helpText.innerHTML = `
<h2>Welcome!</h2>
<p>Gridtionary is a simple game with complex and open-ended solutions.</p>
<p>You start with a 4x4 inner grid of random letters, and an active tile on the edge. Your aim is to find as many English words as possible in this grid of letters. You build words by selecting adjacent letters one by one - adjacent in this case means left, right, below, above, <em>or diagonal</em> to the last letter selected. You can only use each letter in the grid once per word.</p>
<p>Each time you find a word, hit that orange button above the grid. If it's a valid word, and it's at least ${MIN_WORD_LENGTH} letters long, it'll be added to your list. You score a point for each letter in the word! You can only add each unique word once.</p>
<p>Once you've found as many words as you can, take a look at the active tile on the side. If you drag it to any of the open edge spots outside the grid, it will shift that row or column of letters over, and you'll get a rearranged grid with a new active tile on the other side. This can help you find many more words! But be careful - each shift will cost you ${SHIFT_COST} points. That means that on average, you'll want to make sure you can find at least ${parseInt(Math.ceil(SHIFT_COST/MIN_WORD_LENGTH))} words of minimum length each time you shift the grid.</p>
<p>The grid of letters will refresh every day, and everyone playing Gridtionary starts with the same grid! There is no end to the puzzle each day. Just find as many words as you can, be careful when you shift, and have fun!</p>
`;
helpBox.appendChild(helpText);
helpButton.addEventListener('click', (e) => {
    e.stopPropagation();
    helpBox.show();
});
document.querySelector('.hideHelp').addEventListener('click', (e) => {
    e.stopPropagation();
    helpBox.close();
});

