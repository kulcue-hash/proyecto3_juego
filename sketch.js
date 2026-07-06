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

  class Button{
      constructor(x, y, w, h, label, onClick){
          this.x = x; // Posición del boton en x
          this.y = y; // Posicion del boton en y
          this.w = w; // ancho del boton
          this.h = h; // Alto del boton 
          this.label = label; // Texto del boton
          this.onClick = onClick; // Que hace el boton cuando se oprime

          this.baseColor = [70, 130, 180, 180]; // color con transparencia para el boton
          this.hoverColor = [100, 160, 220, 220]; // más claro al pasar mouse
          this.textColor = [255, 255, 255];
          this.radius = 12;
      }

      show (){
        let isHover = this.isHover(mouseX, mouseY);
        
        //Si esta en el boton el mouse que sea gris
        if (isHover){
          fill(255, 150); // Un poco más brillante en hover
        } 
        // sino esta que este normal
        else{
          fill(200, 80);
        }
        stroke(255); // Contorno blanco para verse más limpio
        strokeWeight(2);
        rectMode(CORNER);
        rect(this.x, this.y, this.w, this.h, this.radius); // Bordes redondeados

        // Texto
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(20);
        text(this.label, this.x + this.w/2, this.y + this.h/2);
      }

      // Detecta si el mouse esta encima del boton
      isHover(mx, my){
          return mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h; 
      }

      // Ejecuta la acción si da click en el boton
      handleClick(){
          if(this.isHover(mouseX, mouseY)){
              this.onClick();
          }
      }
  }

  function createButtons(){
      // Botón del Menú
      btnPlay = new Button(width/2 - 75, height/2, 150, 50, "Jugar", () => {
        gameState = "playing";
      });
      
      // Botón de Siguiente Nivel (Pantalla de Victoria)
      btnNextLevel = new Button(width/2 - 100, height/2 + 50, 200, 50, "Siguiente Nivel", () => {
        currentLevel++;          // Subimos de nivel
        targetScore += 200;      // Aumentamos la dificultad
        points = 0;              // Reiniciamos los puntos
        initBoard();             // Volvemos a llenar el tablero
        gameState = "playing";   // Volvemos a jugar
      });
  }


// CLASE CANDY - Estrategia de Objetos de Celda
class Candy {
  constructor(type) {
    this.type = type; // Índice del color del dulce
    this.fallOffsetY = 0; // Variable para almacenar desplazamiento vertical durante caidas
  }

  display({ row, col }) {
    let cellLength = Quadrille.cellLength;
    let offsetX = 0; 
    let offsetY = this.fallOffsetY;

    // Animación de caída
    if (abs(this.fallOffsetY) > 0.5) {
      this.fallOffsetY = lerp(this.fallOffsetY, 0, 0.1); 
    } else {
      this.fallOffsetY = 0;
    }

    // Si existe una animación activa
    if (swapAnimation) {
      let t = constrain((millis() - swapAnimation.startTime) / animationDuration, 0, 1);
      if (this === swapAnimation.candy1) {
        offsetX = lerp(0, swapAnimation.dx, t); 
        offsetY += lerp(0, swapAnimation.dy, t);
      }
      if (this === swapAnimation.candy2) { 
        offsetX = lerp(0, -swapAnimation.dx, t);
        offsetY += lerp(0, -swapAnimation.dy, t);
      }
    }

    push(); 
    translate(offsetX, offsetY); 

    fill(candyColors[this.type]);
    if (selected && selected.r === row && selected.c === col) {
      stroke(255); // Borde blanco brillante para selección
      strokeWeight(4);
    } else {
      noStroke();
    }
    circle(cellLength / 2, cellLength / 2, cellLength * 0.8);
    pop(); 
  }
}

// Implementación de Herencias para dulces especiales
class SpecialCandy extends Candy {
  constructor(type) {
    super(type); 
  }

  display({ row, col }) {
    let cellLength = Quadrille.cellLength;
    let offsetX = 0; 
    let offsetY = this.fallOffsetY;

    if (abs(this.fallOffsetY) > 0.5) {
      this.fallOffsetY = lerp(this.fallOffsetY, 0, 0.1);
    } else {
      this.fallOffsetY = 0;
    }

    if (swapAnimation) {
      let t = constrain((millis() - swapAnimation.startTime) / animationDuration, 0, 1);
      if (this === swapAnimation.candy1) {
        offsetX = lerp(0, swapAnimation.dx, t);
        offsetY += lerp(0, swapAnimation.dy, t);
      }
      if (this === swapAnimation.candy2) {
        offsetX = lerp(0, -swapAnimation.dx, t);
        offsetY += lerp(0, -swapAnimation.dy, t);
      }
    }

    push();
    translate(offsetX, offsetY);
    fill(candyColors[this.type]);
    
    if (selected && selected.r === row && selected.c === col) {
      stroke(255);
      strokeWeight(4);
    } else {
      noStroke();
    }
    circle(cellLength / 2, cellLength / 2, cellLength * 0.8);
    
    //EFECTO VISUAL DEL DULCE ESPECIAL
    fill(255, 200); 
    noStroke();
    rectMode(CENTER);
    rect(cellLength / 2, cellLength / 2, cellLength * 0.3, cellLength * 0.3); 
    pop();
  }
}


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

// SETUP
function setup() {
  Quadrille.cellLength = 60;
  // Hacemos el canvas un poco más alto para poner UI arriba
  createCanvas(cols * Quadrille.cellLength, (rows * Quadrille.cellLength) + 60);

  candyColors = [color(255, 50, 50), color(50, 255, 50), color(50, 100, 255), color(255, 255, 50), color(200, 50, 255)]; 

  board = createQuadrille(cols, rows);
  initBoard(); // Llenamos el tablero
  createButtons();
}

// Función separada para poder reiniciar el tablero en cada nivel
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
  switch(gameState){ 
          case "menu":
              drawMenu();
              break;
          case "playing":
              drawPlaying();
              break;
          case "win": // Victoria
              drawWin();
              break;
      }
}


function drawMenu(){
      background(30, 20, 50); // Fondo morado oscuro estético
      
      push();
      textAlign(CENTER);
      
      // Sombra del título
      fill(0, 150);
      textSize(50);
      text("Tales colores", width/2 + 3, height/2 - 100 + 3);
      
      // Título principal
      fill(255, 200, 250); // Texto rosita claro
      text("Tales colores", width/2, height/2 - 100);
      
      // Subtítulo
      textSize(20);
      fill(200);
      text("¡Combina 3 o más para ganar!", width/2, height/2 - 40);
      pop();
      
      btnPlay.show();
  }

function drawWin() {
    background(20, 60, 40); // Fondo verde oscuro estético
    
    push();
    textAlign(CENTER);
    fill(255);
    textSize(40);
    text("¡Nivel " + currentLevel + " BACANO!", width/2, height/2 - 50);
    
    textSize(25);
    fill(200, 255, 200);
    text("Puntos obtenidos: " + points, width/2, height/2);
    pop();
    
    btnNextLevel.show();
}

function drawPlaying(){
  background(40); // Fondo del juego
  
  //UI del Juego 
  push();
  fill(30);
  rect(0, 0, width, 60); // Barra superior
  fill(255);
  textSize(18);
  textAlign(LEFT, CENTER);
  text("Nivel: " + currentLevel, 10, 30);
  textAlign(CENTER, CENTER);
  text("Meta: " + targetScore, width/2, 30);
  textAlign(RIGHT, CENTER);
  text("Puntos: " + points, width - 10, 30);
  pop();

  push();
  translate(0, 60); // Desplazamos el tablero hacia abajo para dejar espacio a la UI
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
  
  // Chequeo de Victoria: Si no hay animaciones ocurriendo y se alcanzó la meta
  if (!gravityAnimating && !swapAnimation && !waitingCascade) {
      if (points >= targetScore) {
          gameState = "win"; // ¡Cambiamos la máquina de estado!
      }
  }
}


function updateAnimation() {
  if (!swapAnimation) return; 
  let elapsed = millis() - swapAnimation.startTime; 
  if (elapsed >= animationDuration) { 

    board.fill(swapAnimation.r2, swapAnimation.c2, swapAnimation.candy1);
    board.fill(swapAnimation.r1, swapAnimation.c1, swapAnimation.candy2);
    selected = null;  
    swapAnimation = null;
    checkPattern();
  }
}

function mousePressed() {
  if (swapAnimation || gravityAnimating) return;

  switch(gameState) {

     case "menu":
      btnPlay.handleClick();
      break;
      
     case "win": // Funcionalidad del click en estado victoria
      btnNextLevel.handleClick();
      break;

 case "playing":
      if (gravityAnimating) return;
      if (swapAnimation) return;
      
      // Lectura de coordenadas ajustadas por la barra superior de UI
      const r = floor((mouseY - 60) / Quadrille.cellLength);
      const c = floor(mouseX / Quadrille.cellLength);
      
      if (!board.isValid(r, c) || mouseY < 60) return;

      let clickedCandy = board.read(r, c); // Leemos qué dulce hay en esa casilla

      // PRIMER CLICK
      if (selected === null) {
        // Si le das clic a un dulce congelado, el juego te ignora
        if (clickedCandy instanceof SpecialCandy) return; 
        
        selected = { r: r, c: c };
        return; 
      }

      // Deseleccionar si tocas la misma pieza
      if (selected.r === r && selected.c === c) {
        selected = null; 
        return;
      }
      
      let isAdjacent = (abs(selected.r - r) === 1 && selected.c === c) ||
        (abs(selected.c - c) === 1 && selected.r === r);

      // SEGUNDO CLICK
      if (isAdjacent) {
        let candy1 = board.read(selected.r, selected.c); 
        let candy2 = board.read(r, c); 

        // Si intentas intercambiar tu pieza con un dulce congelado, cancelamos
        if (candy2 instanceof SpecialCandy) {
            selected = null;
            return;
        }

        // Si ninguna es de hielo, iniciamos la animación normal
        swapAnimation = {
          candy1, candy2,
          r1: selected.r, c1: selected.c,
          r2: r, c2: c,
          dx: (c - selected.c) * Quadrille.cellLength, 
          dy: (r - selected.r) * Quadrille.cellLength, 
          startTime: millis() 
        };
      }
      break;
    }
}

function addUnique(toRemove, r, c) { 
  let exists = toRemove.some(
    pos => pos.r === r && pos.c === c
  ); 

  if (!exists) {
    toRemove.push({ r, c });
    points += 10; // ¡Aquí se suman los puntos!
  } 
}

function checkPattern() {
  let toRemove = []; 

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - 3; c++) { 
      let candy1 = board.read(r, c);
      let candy2 = board.read(r, c + 1);
      let candy3 = board.read(r, c + 2); 
      let candy4 = (c <= cols - 4) ? board.read(r, c + 3) : null; 

      if (candy1 && candy2 && candy3 && candy1.type === candy2.type && candy2.type === candy3.type) { 
        addUnique(toRemove, r, c);
        addUnique(toRemove, r, c + 1);
        addUnique(toRemove, r, c + 2); 
        
        if (candy4 && candy3.type === candy4.type) { 
            addUnique(toRemove, r, c + 3);
            candy1.makeSpecial = true; 
        }
      }
    }
  }

  for (let c = 0; c < cols; c++) { 

    for (let r = 0; r <= rows - 3; r++) {
      let candy1 = board.read(r, c);
      let candy2 = board.read(r + 1, c);
      let candy3 = board.read(r + 2, c);
      let candy4 = (r <= rows - 4) ? board.read(r + 3, c) : null; 

      if (candy1 && candy2 && candy3 && candy1.type === candy2.type && candy2.type === candy3.type) {
        addUnique(toRemove, r, c);
        addUnique(toRemove, r + 1, c);
        addUnique(toRemove, r + 2, c);
        
        if (candy4 && candy3.type === candy4.type) { 
            addUnique(toRemove, r + 3, c);
            candy1.makeSpecial = true; 
        }
      }
    }
  }
  
  for (let pos of toRemove) { 
    let currentCandy = board.read(pos.r, pos.c);
    
    if (currentCandy && currentCandy.makeSpecial) {
       board.fill(pos.r, pos.c, new SpecialCandy(currentCandy.type));
    } else {
       board.fill(pos.r, pos.c, null);
    }
  }
  
  if (toRemove.length > 0) {
    gravityAnimating = true;
  }
}

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
