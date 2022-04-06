// Some actually constant consts
const cols = "ABCDEF";
const letter_gen = "bcdfghjklmnpqrstvwxyzaeiouaeiouaeiouaeiou";
const MIDDLE = 0;
const EDGE = 1;
const CORNER = 2;
const styles = ["letter", "edge", "corner"];

//TODO: Move this into Tile?
const game = document.querySelector('.game');

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
    constructor(row, col, setActive, shiftTiles) {
        const l = loc(row, col);
        this.row = row;
        this.col = col;
        
        // These two are distinct functions so the receiving tile can set the coords for the shift, and then the original active tile can call the shift after it cleans itself up
        this.setActive = setActive;
        this.shiftTiles = shiftTiles;
        
        // Necessary to have consistent event callbacks to remove
        this.dragEnd = this.onDragEnd.bind(this);
        this.dragOver = this.onDragOver.bind(this);
        this.drop = this.onDrop.bind(this);
        
        // Create the element with id, and init if 
        this.element = document.createElement('span');
        this.element.setAttribute('id', `${cols[col]}${row}`);
        
        // Initialize edges, middle, and active tile
        this.emptyBorder(l);
        if (l === MIDDLE) {
            // Middle tile - generate a random letter
            this.element.innerHTML = letter_gen[Math.floor(Math.random() * letter_gen.length)];
            this.element.setAttribute('class', 'letter');
        }
        else if (row === 1 && col === 0) {
            // Our starting active tile
            const c = letter_gen[Math.floor(Math.random() * letter_gen.length)];
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
}

const tiles = [];

let active_row = 1;
let active_col = 0;

function setActive(row, col) {
    active_row = row;
    active_col = col;
}

// Shift the active tile's row or column, putting it in the middle and creating a new active tile
function shiftTiles() {
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

// Populate the whole grid, add style, and generate a letter for each of the middle tiles
for (row=0;row<6;row++) {
    const tile_row = [];
    for (col=0;col<6;col++) {
        const l = loc(row, col);
        const tile = new Tile(row, col, setActive, shiftTiles);
        tile_row.push(tile);
    }
    tiles.push(tile_row);
}






