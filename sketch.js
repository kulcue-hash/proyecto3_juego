let board; // Definición de pantalla de juego
let game;     // Pantalla principal
const rows = 8; // Definición de tamaño de tablero
const cols = 8;
let candyColors; // Arreglo para almacenar los colores de los dulces
let selected = null; // Variable para almacenar la posición del primer dulce seleccionado

// --- VARIABLES DE NIVELES Y PUNTAJE ---
let points = 0;
let currentLevel = 1;
let targetScore = 300; // Puntos necesarios para pasar el nivel 1

let gameState = "menu"; // menu, playing, win
let btnPlay;
let btnNextLevel; // Botón para la pantalla de victoria

// Variables para animaciones
let swapAnimation = null; // Variable para almacenar información de animación de intercambio
let gravityAnimating = false; // Variable para indicar si se está aplicando la animación de gravedad
let waitingCascade = false; // retraso aplicado antes de buscar nuevos patrones después de aplicar gravedad
let cascadeStartTime = 0; // Se guarda cuando empezó dicho retraso para posterior medida 
const cascadeDelay = 15; // tiempo en milisegundos antes de buscar nuevos patrones
let animationDuration = 250; // Se define duración de la animación ms
const lockInterval = 3; // cantidad de movimientos entre bloqueos aleatorios
let movesSinceLock = 0; // contador de movimientos realizados desde el último bloqueo

let boardX;
let boardY;
let menuBackground;
let gameBackground;
let bombImage; // Imagen de la bomba de color
let SpecialCandyImages = []; // Arreglo para dulces rayados especiales
let candyImages = []; // Arreglo para almacenar imágenes de dulces
let lastPatternInfo = null;

function preload() {
  menuBackground = loadImage("menu.jpg");
  gameBackground = loadImage("canva.jpeg");
  bombImage = loadImage("SpecialCandies/ColorBomb.png"); // Imagen de la bomba
  
  candyImages[0] = loadImage("Candyred.png");
  candyImages[1] = loadImage("candyGreen.png");
  candyImages[2] = loadImage("candyBlue.png");
  candyImages[3] = loadImage("candyYellow.png");
  candyImages[4] = loadImage("candyPurple.png");

  // Cargamos los dulces especiales rayados (Horizontales y Verticales)
  SpecialCandyImages[0] = [loadImage("SpecialCandies/CRh.png"), loadImage("SpecialCandies/CRv.png")];
  SpecialCandyImages[1] = [loadImage("SpecialCandies/CGh.png"), loadImage("SpecialCandies/CGv.png")];
  SpecialCandyImages[2] = [loadImage("SpecialCandies/CBh.png"), loadImage("SpecialCandies/CBv.png")];
  SpecialCandyImages[3] = [loadImage("SpecialCandies/CYh.png"), loadImage("SpecialCandies/CYv.png")];
  SpecialCandyImages[4] = [loadImage("SpecialCandies/CPh.png"), loadImage("SpecialCandies/CPv.png")];
  SpecialCandyImages[5] = [loadImage("SpecialCandies/ColorBomb.png")];
}

class Button {
  constructor(x, y, w, h, label, onClick) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
    this.onClick = onClick;

    this.baseColor = [0, 0, 255, 0];
    this.hoverColor = [100, 160, 220, 220];
    this.textColor = [255, 255, 255];
    this.radius = 12;
  }

  show() {
    let isHover = this.isHover(mouseX, mouseY);
    if (isHover) {
      fill(255, 150);
    } else {
      fill(200, 80);
    }
    stroke(255);
    strokeWeight(2);
    rectMode(CORNER);
    rect(this.x, this.y, this.w, this.h, this.radius);

    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(20);
    text(this.label, this.x + this.w / 2, this.y + this.h / 2);
  }

  isHover(mx, my) {
    return mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h;
  }

  handleClick() {
    if (this.isHover(mouseX, mouseY)) {
      this.onClick();
    }
  }
}

function createButtons() {
  btnPlay = new Button(width / 2 - 130, height / 2 + 165, 150, 50, "Jugar", () => {
    gameState = "playing";
  });

  btnNextLevel = new Button(width / 2 - 100, height / 2 + 50, 200, 50, "Siguiente Nivel", () => {
    currentLevel++;
    targetScore += 200;
    points = 0;
    initBoard();
    gameState = "playing";
  });
}

// ==========================================
// CLASES DE DULCES (ESTRATEGIA POLIMÓRFICA)
// ==========================================

// 1. CLASE BASE: CANDY (Dulce Normal)
class Candy {
  constructor(type) {
    this.type = type; // Índice del color del dulce
    this.fallOffsetY = 0; // Variable para almacenar desplazamiento vertical durante caídas
    this.locked = false; // Si el dulce está bloqueado
  }

  getDisplayOffset({ row, col }) {
    let offsetX = 0;
    let offsetY = this.fallOffsetY;

    // Animación de caída
    if (abs(this.fallOffsetY) > 0.1) {
      this.fallOffsetY = lerp(this.fallOffsetY, 0, 0.1);
    } else {
      this.fallOffsetY = 0;
    }

    // Animación de intercambio
    if (swapAnimation) {
      let t = constrain((millis() - swapAnimation.startTime) / animationDuration, 0, 1);

      if (swapAnimation.reverse) {
        if (this === swapAnimation.candy1) {
          offsetX = lerp(0, -swapAnimation.dx, t);
          offsetY += lerp(0, -swapAnimation.dy, t);
        }
        if (this === swapAnimation.candy2) {
          offsetX = lerp(0, swapAnimation.dx, t);
          offsetY += lerp(0, swapAnimation.dy, t);
        }
      } else {
        if (this === swapAnimation.candy1) {
          offsetX = lerp(0, swapAnimation.dx, t);
          offsetY += lerp(0, swapAnimation.dy, t);
        }
        if (this === swapAnimation.candy2) {
          offsetX = lerp(0, -swapAnimation.dx, t);
          offsetY += lerp(0, -swapAnimation.dy, t);
        }
      }
    }

    return { offsetX, offsetY };
  }

  drawCandyBody({ row, col }) {
    let cellLength = Quadrille.cellLength;

    // Dibujar selección de manera estandarizada
    if (selected && selected.r === row && selected.c === col) {
      stroke(255);
      strokeWeight(4);
      noFill();
      circle(cellLength / 2, cellLength / 2, cellLength * 0.9);
    }

    imageMode(CENTER);
    image(
      candyImages[this.type],
      cellLength / 2,
      cellLength / 2,
      cellLength * 0.85,
      cellLength * 0.85
    );

    if (this.locked) {
      noStroke();
      fill(255);
      rectMode(CENTER);
      rect(cellLength / 2, cellLength / 2, cellLength * 0.3, cellLength * 0.3);
    }
  }

  display({ row, col }) {
    let { offsetX, offsetY } = this.getDisplayOffset({ row, col });
    push();
    translate(offsetX, offsetY);
    this.drawCandyBody({ row, col });
    pop();
  }

  activate(board, row, col) {
    return false; // Dulces normales no tienen activación directa al hacer click
  }
}

// 2. CLASE: SPECIAL CANDY (Dulce Rayado - Hereda de Candy)
class specialCandy extends Candy {
  constructor(type, kind = null) {
    super(type);
    this.kind = kind; // "horizontal" o "vertical"
  }

  getSpecialImage() {
    if (this.kind === "horizontal") {
      return SpecialCandyImages[this.type][0];
    }
    if (this.kind === "vertical") {
      return SpecialCandyImages[this.type][1];
    }
    return null;
  }

  display({ row, col }) {
    let { offsetX, offsetY } = this.getDisplayOffset({ row, col });
    let cellLength = Quadrille.cellLength;
    let specialImage = this.getSpecialImage();

    push();
    translate(offsetX, offsetY);

    // Dibujar selección si es que está marcado
    if (selected && selected.r === row && selected.c === col) {
      noFill();
      stroke(255);
      strokeWeight(4);
      circle(cellLength / 2, cellLength / 2, cellLength * 0.9);
    }

    if (specialImage) {
      imageMode(CENTER);
      image(
        specialImage,
        cellLength / 2,
        cellLength / 2,
        cellLength * 0.85,
        cellLength * 0.85
      );
    } else {
      this.drawCandyBody({ row, col });
    }

    if (this.locked) {
      noStroke();
      fill(255);
      rectMode(CENTER);
      rect(cellLength / 2, cellLength / 2, cellLength * 0.3, cellLength * 0.3);
    }

    pop();
  }
}

// 3. CLASE: COLOR BOMB (Bomba que explota - Hereda de Candy)
class ColorBomb extends Candy {
  constructor() {
    super(-1); // Usamos -1 para distinguirlo de los colores normales
  }

  display({ row, col }) {
    let { offsetX, offsetY } = this.getDisplayOffset({ row, col });
    let cellLength = Quadrille.cellLength;

    push();
    translate(offsetX, offsetY);

    // Círculo de selección
    if (selected && selected.r === row && selected.c === col) {
      stroke(255);
      strokeWeight(4);
      noFill();
      circle(cellLength / 2, cellLength / 2, cellLength * 0.9);
    }

    imageMode(CENTER);
    image(
      bombImage,
      cellLength / 2,
      cellLength / 2,
      cellLength * 0.90,
      cellLength * 0.90
    );
    pop();
  }

  activate(board, row, col) {
    // La bomba se borra a sí misma primero
    board.fill(row, col, null);

    // Destruye 20 dulces aleatorios que no sean otras bombas de color
    let destroyed = 0;
    let attempts = 0;
    while (destroyed < 20 && attempts < 200) {
      attempts++;
      let rr = floor(random(rows));
      let cc = floor(random(cols));

      let candy = board.read(rr, cc);
      if (candy != null && !(candy instanceof ColorBomb)) {
        board.fill(rr, cc, null);
        destroyed++;
        points += 10;
      }
    }
    gravityAnimating = true;
    return true; // Retorna true para confirmar que se detonó
  }
}

// ==========================================
// FUNCIONES DE CONTROL DE TABLERO
// ==========================================

function getValidCandy(row, col) {
  let validTypes = [];
  for (let type = 0; type < candyColors.length; type++) {
    let isValid = true;

    if (col >= 2) {
      let c1 = board.read(row, col - 1);
      let c2 = board.read(row, col - 2);
      if (c1 && c2 && c1.type === type && c2.type === type) {
        isValid = false;
      }
    }
    if (isValid && row >= 2) {
      let c1 = board.read(row - 1, col);
      let c2 = board.read(row - 2, col);
      if (c1 && c2 && c1.type === type && c2.type === type) {
        isValid = false;
      }
    }

    if (isValid) {
      validTypes.push(type);
    }
  }
  return validTypes[floor(random(validTypes.length))];
}

function setup() {
  Quadrille.cellLength = 60;
  createCanvas(windowWidth, windowHeight);
  candyColors = [color(255, 50, 50), color(50, 255, 50), color(50, 100, 255), color(255, 255, 50), color(200, 50, 255)];

  board = createQuadrille(cols, rows);
  initBoard();
  createButtons();
}

function initBoard() {
  board.clear();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let validType = getValidCandy(r, c);
      board.fill(r, c, new Candy(validType));
    }
  }
}

function draw() {
  switch (gameState) {
    case "menu":
      drawMenu();
      break;
    case "playing":
      drawPlaying();
      break;
    case "win":
      drawWin();
      break;
  }
}

function drawMenu() {
  image(gameBackground, 0, 0, width, height);

  push();
  textAlign(CENTER);
  fill(0, 150);
  textSize(30);
  text("¡Combina 3 o más para ganar!", width / 2 - 60 + 3, height / 2 + 110 + 3);

  fill(255, 200, 250);
  text("¡Combina 3 o más para ganar!", width / 2 - 60, height / 2 + 110);
  pop();

  btnPlay.show();
}

function drawWin() {
  background(20, 60, 40);

  push();
  textAlign(CENTER);
  fill(255);
  textSize(40);
  text("¡Nivel " + currentLevel + " BACANO!", width / 2, height / 2 - 50);

  textSize(25);
  fill(200, 255, 200);
  text("Puntos obtenidos: " + points, width / 2, height / 2);
  pop();

  btnNextLevel.show();
}

function drawPlaying() {
  image(menuBackground, 0, 0, width, height);
  boardX = (width - cols * Quadrille.cellLength) / 2;
  boardY = 140;

  push();
  fill(10, 10, 10, 210);
  rect(0, 0, width, 100);
  translate(0, 30);
  fill(255);
  textSize(18);
  textAlign(LEFT, CENTER);
  text("Nivel: " + currentLevel, 40, 30);
  textAlign(CENTER, CENTER);
  text("Meta: " + targetScore, width / 2, 30);
  textAlign(RIGHT, CENTER);
  text("Puntos: " + points, width - 40, 30);
  pop();

  push();
  fill(0, 0, 0, 110);
  stroke(255, 120);
  strokeWeight(2);
  rect(boardX, boardY, cols * Quadrille.cellLength, rows * Quadrille.cellLength, 0);
  pop();

  push();
  translate(boardX, boardY);
  drawQuadrille(board);
  updateAnimation();

  if (gravityAnimating) {
    applyGravity();
    if (gravityFinished()) {
      gravityAnimating = false;
      waitingCascade = true;
      cascadeStartTime = millis();
    }
  }

  if (waitingCascade && millis() - cascadeStartTime > cascadeDelay) {
    waitingCascade = false;
    checkPattern();
  }
  pop();

  if (!gravityAnimating && !swapAnimation && !waitingCascade) {
    if (points >= targetScore) {
      gameState = "win";
    }
  }
}

function updateAnimation() {
  if (!swapAnimation) return;

  let elapsed = millis() - swapAnimation.startTime;

  if (elapsed >= animationDuration) {
    if (swapAnimation.reverse) {
      board.fill(swapAnimation.r1, swapAnimation.c1, swapAnimation.candy1);
      board.fill(swapAnimation.r2, swapAnimation.c2, swapAnimation.candy2);
      swapAnimation = null;
      selected = null;
    } else {
      board.fill(swapAnimation.r2, swapAnimation.c2, swapAnimation.candy1);
      board.fill(swapAnimation.r1, swapAnimation.c1, swapAnimation.candy2);
      
      const r1 = swapAnimation.r1;
      const c1 = swapAnimation.c1;
      const r2 = swapAnimation.r2;
      const c2 = swapAnimation.c2;
      const candy1 = swapAnimation.candy1;
      const candy2 = swapAnimation.candy2;
      
      swapAnimation = null;
      selected = null;
      
      const found = checkPattern();
      if (!found) {
        swapAnimation = {
          candy1,
          candy2,
          r1,
          c1,
          r2,
          c2,
          dx: (c2 - c1) * Quadrille.cellLength,
          dy: (r2 - r1) * Quadrille.cellLength,
          startTime: millis(),
          reverse: true
        };
      }
    }
  }
}

function lockRandomCandy() {
  let available = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let candy = board.read(r, c);
      if (candy && !candy.locked) {
        available.push({ r, c, candy });
      }
    }
  }
  if (available.length === 0) return;
  let choice = available[floor(random(available.length))];
  choice.candy.locked = true;
}

function mousePressed() {
  if (swapAnimation || gravityAnimating) return;

  switch (gameState) {
    case "menu":
      btnPlay.handleClick();
      break;

    case "win":
      btnNextLevel.handleClick();
      break;

    case "playing":
      if (gravityAnimating) return;
      if (swapAnimation) return;

      const r = floor((mouseY - boardY) / Quadrille.cellLength);
      const c = floor((mouseX - boardX) / Quadrille.cellLength);

      if (!board.isValid(r, c) || mouseY < boardY) return;

      let clickedCandy = board.read(r, c);

      if (selected === null) {
        let firstCandy = board.read(r, c);
        if (firstCandy && firstCandy.locked) return;
        selected = { r: r, c: c };
        return;
      }

      if (selected.r === r && selected.c === c) {
        selected = null;
        return;
      }

      let secondCandy = board.read(r, c);
      if (secondCandy && secondCandy.locked) {
        selected = null;
        return;
      }

      let isAdjacent = (abs(selected.r - r) === 1 && selected.c === c) ||
        (abs(selected.c - c) === 1 && selected.r === r);

      if (isAdjacent) {
        let candy1 = board.read(selected.r, selected.c);
        let candy2 = board.read(r, c);

        // Activar bomba de color si se seleccionó una
        if (candy1 && candy1.activate(board, selected.r, selected.c)) {
          selected = null;
          return;
        }
        if (candy2 && candy2.activate(board, r, c)) {
          selected = null;
          return;
        }

        swapAnimation = {
          candy1, candy2,
          r1: selected.r, c1: selected.c,
          r2: r, c2: c,
          dx: (c - selected.c) * Quadrille.cellLength,
          dy: (r - selected.r) * Quadrille.cellLength,
          startTime: millis()
        };
        movesSinceLock += 1;
        if (movesSinceLock >= lockInterval) {
          lockRandomCandy();
          movesSinceLock = 0;
        }
      }
  }
}

// DETECCIÓN DE PATRONES Y CREACIÓN DE ESPECIALES

function addRemovalPosition(toRemove, r, c) {
  if (r < 0 || r >= rows || c < 0 || c >= cols) return;
  let exists = toRemove.some(pos => pos.r === r && pos.c === c);
  if (!exists) {
    toRemove.push({ r, c });
    points += 10;
  }
}

// Expande de forma recursiva la destrucción si golpea dulces rayados
function expandSpecialCandyRemoval(toRemove) {
  let expanded = [...toRemove];
  let i = 0;
  
  while (i < expanded.length) {
    let pos = expanded[i];
    let candy = board.read(pos.r, pos.c);
    
    if (candy instanceof specialCandy) {
      if (candy.kind === "horizontal") {
        for (let colIndex = 0; colIndex < cols; colIndex++) {
          addRemovalPosition(expanded, pos.r, colIndex);
        }
      } else if (candy.kind === "vertical") {
        for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
          addRemovalPosition(expanded, rowIndex, pos.c);
        }
      }
    }
    i++;
  }
  return expanded;
}

function checkPattern() {
  let toRemove = [];
  let specialsToCreate = []; // Guardará { r, c, type, (kind, candyType) }

  // 1. Buscar Coincidencias Horizontales
  for (let r = 0; r < rows; r++) {
    let runStart = 0;
    let runType = null;

    for (let c = 0; c <= cols; c++) {
      let candy = c < cols ? board.read(r, c) : null;
      let candyType = (candy && candy.type >= 0) ? candy.type : null; // Ignoramos bombas de color (-1)

      if (runType === null) {
        if (c < cols && candyType !== null) {
          runType = candyType;
          runStart = c;
        }
      } else if (c === cols || candyType !== runType) {
        let matchLength = c - runStart;
        if (matchLength >= 3) {
          for (let i = runStart; i < c; i++) {
            addRemovalPosition(toRemove, r, i);
          }

          // ¿Crear especial horizontal?
          if (matchLength === 5) {
            let centerCol = runStart + 2;
            specialsToCreate.push({ r, c: centerCol, specType: "ColorBomb" });
          } else if (matchLength === 4) {
            let targetCol = c - 1; // Ubicamos el dulce al final de la coincidencia
            specialsToCreate.push({ r, c: targetCol, specType: "Striped", kind: "horizontal", candyType: runType });
          }
        }
        if (c < cols && candyType !== null) {
          runType = candyType;
          runStart = c;
        } else {
          runType = null;
        }
      }
    }
  }

  // 2. Buscar Coincidencias Verticales
  for (let c = 0; c < cols; c++) {
    let runStart = 0;
    let runType = null;

    for (let r = 0; r <= rows; r++) {
      let candy = r < rows ? board.read(r, c) : null;
      let candyType = (candy && candy.type >= 0) ? candy.type : null;

      if (runType === null) {
        if (r < rows && candyType !== null) {
          runType = candyType;
          runStart = r;
        }
      } else if (r === rows || candyType !== runType) {
        let matchLength = r - runStart;
        if (matchLength >= 3) {
          for (let i = runStart; i < r; i++) {
            addRemovalPosition(toRemove, i, c);
          }

          // ¿Crear especial vertical?
          if (matchLength === 5) {
            let centerRow = runStart + 2;
            specialsToCreate.push({ r: centerRow, c, specType: "ColorBomb" });
          } else if (matchLength === 4) {
            let targetRow = r - 1;
            specialsToCreate.push({ r: targetRow, c, specType: "Striped", kind: "vertical", candyType: runType });
          }
        }
        if (r < rows && candyType !== null) {
          runType = candyType;
          runStart = r;
        } else {
          runType = null;
        }
      }
    }
  }

  // 3. Evaluar explosiones en cadena de dulces rayados
  const expandedToRemove = expandSpecialCandyRemoval(toRemove);

  // 4. Limpiar del tablero los dulces destruidos
  for (let pos of expandedToRemove) {
    board.fill(pos.r, pos.c, null);
  }

  // 5. Spawnear los dulces especiales en las casillas correspondientes
  for (let spec of specialsToCreate) {
    if (spec.specType === "ColorBomb") {
      board.fill(spec.r, spec.c, new ColorBomb());
    } else if (spec.specType === "Striped") {
      board.fill(spec.r, spec.c, new specialCandy(spec.candyType, spec.kind));
    }
  }

  if (toRemove.length > 0) {
    gravityAnimating = true;
    return true;
  }
  return false;
}

// GRAVEDAD Y CAÍDA DE DULCES

function applyGravity() {
  for (let c = 0; c < cols; c++) {
    for (let r = rows - 1; r >= 0; r--) {
      if (board.read(r, c) === null) {
        for (let above = r - 1; above >= 0; above--) {
          let candy = board.read(above, c);
          if (candy !== null) {
            let distance = r - above;
            board.fill(r, c, candy);
            board.fill(above, c, null);
            candy.fallOffsetY = -distance * Quadrille.cellLength;
            break;
          }
        }
      }
    }
  }

  // Rellenar espacios vacíos superiores con dulces nuevos estándar
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (board.read(r, c) === null) {
        let type = floor(random(candyColors.length));
        let newCandy = new Candy(type);
        newCandy.fallOffsetY = - (r + 1) * Quadrille.cellLength;
        board.fill(r, c, newCandy);
      }
    }
  }
}

function gravityFinished() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let candy = board.read(r, c);
      if (candy && abs(candy.fallOffsetY) > 0) {
        return false;
      }
    }
  }
  return true;
}