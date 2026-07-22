let board; // Definición de pantalla de juego
let game;     // Pantalla principal
const rows = 8; // Definición de tamaño de tablero
const cols = 8; // Definición de tamaño de tablero
let candyColors; // Arreglo para almacenar los colores de los dulces
let selected = null; // Variable para almacenar la posición del primer dulce seleccionado

// --- VARIABLES DE NIVELES Y PUNTAJE ---
let points = 0; // Puntos actuales del jugador
let currentLevel = 1; // Nivel en curso
let targetScore = 300; // Puntos necesarios para pasar el nivel 1

let gameState = "menu"; // menu, playing, win
let btnPlay; // Botón para iniciar a jugar
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

let boardX; // Posición X del tablero
let boardY; // Posición Y del tablero
let menuBackground; // Imagen de fondo del menú
let gameBackground; // Imagen de fondo del juego
let bombImage; // Imagen de la bomba de color
let SpecialCandyImages = []; // Arreglo para dulces rayados especiales
let candyImages = []; // Arreglo para almacenar imágenes de dulces
let lastPatternInfo = null; // Información del último patrón formado

function preload() {
  menuBackground = loadImage("menu.jpg"); // Carga del fondo del menú
  gameBackground = loadImage("canva.jpeg"); // Carga del fondo del juego
  bombImage = loadImage("SpecialCandies/ColorBomb.png"); // Imagen de la bomba
  
  // Cargamos los dulces normales
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
    this.x = x; // Posición del boton en x
    this.y = y; // Posicion del boton en y
    this.w = w; // ancho del boton
    this.h = h; // Alto del boton
    this.label = label; // Texto del boton
    this.onClick = onClick; // Que hace el boton cuando se oprime

    this.baseColor = [0, 0, 255, 0]; // color con transparencia para el boton
    this.hoverColor = [100, 160, 220, 220]; // más claro al pasar mouse
    this.textColor = [255, 255, 255];
    this.radius = 12; // Radio de redondeo de bordes
  }

  show() {
    let isHover = this.isHover(mouseX, mouseY); // Verifica si el mouse está encima
    
    //Si esta en el boton el mouse que sea más brillante
    if (isHover) {
      fill(255, 150); // Un poco más brillante en hover
    } else {
      // sino esta que este normal
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
    text(this.label, this.x + this.w / 2, this.y + this.h / 2);
  }

  // Detecta si el mouse esta encima del boton
  isHover(mx, my) {
    return mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h;
  }

  // Ejecuta la acción si da click en el boton
  handleClick() {
    if (this.isHover(mouseX, mouseY)) {
      this.onClick();
    }
  }
}

function createButtons() {
  // Botón del Menú
  btnPlay = new Button(width / 2 - 130, height / 2 + 165, 150, 50, "Jugar", () => {
    gameState = "playing";
  });

  // Botón de Siguiente Nivel (Pantalla de Victoria)
  btnNextLevel = new Button(width / 2 - 100, height / 2 + 50, 200, 50, "Siguiente Nivel", () => {
    currentLevel++; // Subimos de nivel
    targetScore += 200; // Aumentamos la dificultad
    points = 0; // Reiniciamos los puntos
    initBoard(); // Volvemos a llenar el tablero
    gameState = "playing"; // Volvemos a jugar
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
    this.locked = false; // Si el dulce está bloqueado y no se puede mover
  }

  getDisplayOffset({ row, col }) { // Método que calcula el desplazamiento visual de un dulce
    let offsetX = 0; // variable para mover horizontalmente
    let offsetY = this.fallOffsetY; // variable para mover verticalmente, ya que es afectado por la gravedad

    // Animación de caída
    if (abs(this.fallOffsetY) > 0.1) { // Siempre que el desplazamiento vertical sea mayor a 0.1, se aplica animación
      this.fallOffsetY = lerp(this.fallOffsetY, 0, 0.1); // Lerp interpola entre el valor actual y 0 para suavizar
    } else { // si el desplazamiento vertical es menor a 0.1, se establece en 0 para evitar valores negativos
      this.fallOffsetY = 0;
    }

    // Si existe una animación activa (intercambio)
    if (swapAnimation) { 
      let t = constrain((millis() - swapAnimation.startTime) / animationDuration, 0, 1); // Porcentaje de progreso de posición

      if (swapAnimation.reverse) { // Cuando no hay coincidencias, reverse indica que debe revertirse la posición
        if (this === swapAnimation.candy1) {
          offsetX = lerp(0, -swapAnimation.dx, t); // Interpolación horizontal
          offsetY += lerp(0, -swapAnimation.dy, t); // Interpolación vertical
        }
        if (this === swapAnimation.candy2) {
          offsetX = lerp(0, swapAnimation.dx, t);
          offsetY += lerp(0, swapAnimation.dy, t);
        }
      } else { // Cuando en un intercambio hay coincidencias, se aplica la animación de intercambio normal
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

    return { offsetX, offsetY }; // retorna los desplazamientos calculados
  }

  drawCandyBody({ row, col }) { // Método definir el cuerpo del dulce y si está seleccionado
    let cellLength = Quadrille.cellLength; // Se lee el tamaño de celda

    // Dibujar selección de manera estandarizada
    if (selected && selected.r === row && selected.c === col) { // Si el dulce está seleccionado, se dibuja un contorno
      stroke(255);
      strokeWeight(4);
      noFill();
      circle(cellLength / 2, cellLength / 2, cellLength * 0.9);
    }

    imageMode(CENTER); // Se establece el modo de dibujo de imágenes al centro
    image(
      candyImages[this.type], // Se asigna la imagen del dulce según su tipo
      cellLength / 2,
      cellLength / 2,
      cellLength * 0.85,
      cellLength * 0.85
    );

    if (this.locked) { // Si el dulce está bloqueado, se indica visualmente mediante un cuadrado blanco
      noStroke();
      fill(255);
      rectMode(CENTER);
      rect(cellLength / 2, cellLength / 2, cellLength * 0.3, cellLength * 0.3);
    }
  }

  display({ row, col }) { // Método para dibujar el dulce en la posición de la cuadrícula
    let { offsetX, offsetY } = this.getDisplayOffset({ row, col });
    push();
    translate(offsetX, offsetY);
    this.drawCandyBody({ row, col });
    pop();
  }
<<<<<<< HEAD
  activate(board, row, col){
    return false; // Un dulce normal no tiene poderes especiales
=======

  activate(board, row, col) {
    return false; // Dulces normales no tienen activación directa al hacer click
>>>>>>> main
  }
}

// 2. CLASE: SPECIAL CANDY (Dulce Rayado - Hereda de Candy)
class specialCandy extends Candy { // Implementación de Herencias para dulces especiales
  constructor(type, kind = null) {
    super(type);
    this.kind = kind; // "horizontal" o "vertical" dependiendo de donde resultó
  }

  getSpecialImage() { // Método para obtener la imagen del dulce especial según tipo y orientación
    if (this.kind === "horizontal") {
      return SpecialCandyImages[this.type][0];
    }
    if (this.kind === "vertical") {
      return SpecialCandyImages[this.type][1];
    }
    return null;
  }

  display({ row, col }) { // Método para dibujar el dulce en la cuadrícula
    let { offsetX, offsetY } = this.getDisplayOffset({ row, col });
    let cellLength = Quadrille.cellLength;
    let specialImage = this.getSpecialImage();

    push();
    translate(offsetX, offsetY);

    // Dibujar selección si es que está marcado
    if (selected && selected.r === row && selected.c === col) { // Contorno de selección
      noFill();
      stroke(255);
      strokeWeight(4);
      circle(cellLength / 2, cellLength / 2, cellLength * 0.9);
    }

    if (specialImage) { // Si tiene imagen especial, se dibuja
      imageMode(CENTER);
      image(
        specialImage,
        cellLength / 2,
        cellLength / 2,
        cellLength * 0.85,
        cellLength * 0.85
      );
    } else {
      this.drawCandyBody({ row, col }); // Si no, se dibuja su cuerpo base
    }

    if (this.locked) { // Visualización de bloqueo
      noStroke();
      fill(255);
      rectMode(CENTER);
      rect(cellLength / 2, cellLength / 2, cellLength * 0.3, cellLength * 0.3);
    }

    pop();
  }
}

<<<<<<< HEAD
// CLASE BOMBA DE COLOR (HEREDA DE CANDY)
class ColorBomb extends Candy {
  constructor() {
    // Llamada al constructor de la clase padre con un tipo especial (-1)
    // Los dulces normales estan numerados del 0 a 4
    super(-1);
  }

  // Metodo que dibuja  la bomba y anima los movimientos
  display({ row, col }) {
    let cellLength = Quadrille.cellLength;
    let offsetX = 0;
    let offsetY = this.fallOffsetY;
    
    // Animación de caída
    if (abs(this.fallOffsetY) > 0.5) {
      this.fallOffsetY = lerp(this.fallOffsetY, 0, 0.1); // Lerp suaviza el movimiento
    } else {
      this.fallOffsetY = 0;
    }
    
    // Animación de intercambio
    if (swapAnimation) {
      let t = constrain(
        (millis() - swapAnimation.startTime) / animationDuration,
        0, 1
      );
      if (this === swapAnimation.candy1) {
        offsetX = lerp(0, swapAnimation.dx, t);
        offsetY += lerp(0, swapAnimation.dy, t);
      }
      if (this === swapAnimation.candy2) {
        offsetX = lerp(0, -swapAnimation.dx, t);
        offsetY += lerp(0, -swapAnimation.dy, t);
      }
    }
    // Se dibuja la bomba donde le corresponde
    push();
    translate(offsetX, offsetY);

    // Circulo de selección para la bomba
=======
// 3. CLASE: COLOR BOMB (Bomba que explota - Hereda de Candy)
class ColorBomb extends Candy {
  constructor() {
    super(-1); // Usamos -1 para distinguirlo de los colores normales
  }

  display({ row, col }) { // Método para dibujar la bomba en la cuadrícula
    let { offsetX, offsetY } = this.getDisplayOffset({ row, col });
    let cellLength = Quadrille.cellLength;

    push();
    translate(offsetX, offsetY);

    // Círculo de selección
>>>>>>> main
    if (selected && selected.r === row && selected.c === col) {
      stroke(255);
      strokeWeight(4);
      noFill();
<<<<<<< HEAD
      circle(
        cellLength / 2,
        cellLength / 2,
        cellLength * 0.9
      );
=======
      circle(cellLength / 2, cellLength / 2, cellLength * 0.9);
>>>>>>> main
    }

    imageMode(CENTER);
    image(
<<<<<<< HEAD
      bombImage,
=======
      bombImage, // Se dibuja la imagen única de la bomba
>>>>>>> main
      cellLength / 2,
      cellLength / 2,
      cellLength * 0.90,
      cellLength * 0.90
    );
    pop();
  }
<<<<<<< HEAD
  // Explota la bomba
  activate(board, row, col) {
    // La bomba se borra a sí misma de la casilla donde el jugador hizo clic
    board.fill(row, col, null);

    // Lógica de explosión aleatoria
    let destroyed = 0;
    while (destroyed < 20) {
      let rr = floor(random(rows));
      let cc = floor(random(cols));

      let candy = board.read(rr, cc);
      if (
        candy != null &&
        !(candy instanceof ColorBomb)
      ) {
=======

  activate(board, row, col) { // Método para detonar la bomba
    // La bomba se borra a sí misma primero
    board.fill(row, col, null);

    // Destruye 20 dulces aleatorios que no sean otras bombas de color
    let destroyed = 0;
    let attempts = 0;
    
    // Mientras no alcance 20 destruidos o supere el límite de intentos
    while (destroyed < 20 && attempts < 200) { 
      attempts++;
      let rr = floor(random(rows));
      let cc = floor(random(cols));

      let candy = board.read(rr, cc);
      // Si hay un dulce válido que no sea otra bomba
      if (candy != null && !(candy instanceof ColorBomb)) { 
>>>>>>> main
        board.fill(rr, cc, null);
        destroyed++;
        points += 10;
      }
    }
<<<<<<< HEAD
    gravityAnimating = true;

    // Devolvemos "true" para avisar que la bomba se activó con éxito
    return true;
  }
}

=======
    gravityAnimating = true; // Iniciamos animación de caída tras la explosión
    return true; // Retorna true para confirmar que se detonó
  }
}
>>>>>>> main

// ==========================================
// FUNCIONES DE CONTROL DE TABLERO
// ==========================================

// Función para obtener un tipo de dulce válido que no forme patrones iniciales
function getValidCandy(row, col) {
  let validTypes = []; // Arreglo para almacenar tipos válidos para la posición actual
  
  for (let type = 0; type < candyColors.length; type++) { // Se itera sobre cada tipo de dulce
    let isValid = true; // Variable que verifica si el tipo actual es válido

    // Verificar horizontal (3 en línea hacia la izquierda)
    if (col >= 2) { // Si estamos en una posición mayor a la tercera columna
      let c1 = board.read(row, col - 1); // Se leen los dos dulces a la izquierda
      let c2 = board.read(row, col - 2);
      if (c1 && c2 && c1.type === type && c2.type === type) {
        isValid = false; // Si hay coincidencia en el tipo, no es válido para esa posición
      }
    }
    
    // Verificar vertical (3 en línea hacia arriba)
    if (isValid && row >= 2) { // Si estamos en una posición mayor a la tercera fila
      let c1 = board.read(row - 1, col); // Se leen los dos dulces por encima
      let c2 = board.read(row - 2, col);
      if (c1 && c2 && c1.type === type && c2.type === type) {
        isValid = false; // Si hay coincidencia, no es válido
      }
    }

    if (isValid) {
      validTypes.push(type); // Siempre que sea válido el dulce, se guarda su tipo
    }
  }
  // Siempre que haya almenos un tipo de dulce válido, se retorna uno aleatoriamente
  return validTypes[floor(random(validTypes.length))];
}

// SETUP
function setup() {
  Quadrille.cellLength = 60;
  createCanvas(windowWidth, windowHeight); // Hacemos el canvas para ocupar la pantalla
  candyColors = [color(255, 50, 50), color(50, 255, 50), color(50, 100, 255), color(255, 255, 50), color(200, 50, 255)];

  board = createQuadrille(cols, rows);
  initBoard(); // Llenamos el tablero
  createButtons(); // Se crean los botones
}

// Función separada para poder reiniciar el tablero en cada nivel
function initBoard() {
  board.clear(); // Se limpia el tablero
  
  // Se llena el tablero con instancias del objeto Candy de forma inteligente sin patrones iniciales
  for (let r = 0; r < rows; r++) { // Se recorre cada fila
    for (let c = 0; c < cols; c++) { // Se recorre cada columna
      let validType = getValidCandy(r, c); // Se obtiene un tipo de dulce válido para la posición actual
      board.fill(r, c, new Candy(validType)); // Se llena la posición actual del tablero con el tipo de dulce
    }
  }
}

function draw() {
  switch (gameState) { // Maquina de estados para dibujar la pantalla correspondiente según el estado actual del juego
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

function drawMenu() {
  image(gameBackground, 0, 0, width, height);

  push();
  textAlign(CENTER);
  
  // Sombra del título
  fill(0, 150);
  textSize(30);
  text("¡Combina 3 o más para ganar!", width / 2 - 60 + 3, height / 2 + 110 + 3);

  // Título principal
  fill(255, 200, 250); // Texto rosita claro
  text("¡Combina 3 o más para ganar!", width / 2 - 60, height / 2 + 110);
  pop();

  btnPlay.show(); // Mostramos el botón
}

function drawWin() {
  background(20, 60, 40); // Fondo verde oscuro estético

  push();
  textAlign(CENTER);
  fill(255);
  textSize(40);
  text("¡Nivel " + currentLevel + " BACANO!", width / 2, height / 2 - 50);

  textSize(25);
  fill(200, 255, 200);
  text("Puntos obtenidos: " + points, width / 2, height / 2);
  pop();

  btnNextLevel.show(); // Mostrar botón de siguiente nivel
}

function drawPlaying() {
  image(menuBackground, 0, 0, width, height);
  boardX = (width - cols * Quadrille.cellLength) / 2;
  boardY = 140;

  // UI del Juego
  push();
  fill(10, 10, 10, 210); // Fondo semitransparente para la barra superior
  rect(0, 0, width, 100); // Barra superior
  translate(0, 30); // Ajustamos el texto para que quede centrado verticalmente
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
  fill(0, 0, 0, 110); // blanco con transparencia
  stroke(255, 120);
  strokeWeight(2);
  rect(boardX, boardY, cols * Quadrille.cellLength, rows * Quadrille.cellLength, 0); // Fondo del tablero con bordes redondeados
  pop();

  push();
  translate(boardX, boardY); // Desplazamos el tablero hacia abajo para dejar espacio a la UI
  drawQuadrille(board);
  updateAnimation(); // Siempre que haya un intercambio en proceso, se actualiza la animación

  if (gravityAnimating) { // Dada la eliminación de dulces, se inicia la animación de gravedad
    applyGravity(); // llamando a la función
    if (gravityFinished()) { // Se verifica si la animiación de gravedad a finalizado
      gravityAnimating = false; // Se indica que no se está aplicando la gravedad
      waitingCascade = true; // Se inicia retraso antes de buscar nuevos patrones
      cascadeStartTime = millis(); // Se guarda el tiempo de inicio del retraso para posterior medida
    }
  }

  // Si esta activo el retraso y el tiempo transcurrido es mayor al definido, se busca nuevos patrones formados por la caída
  if (waitingCascade && millis() - cascadeStartTime > cascadeDelay) { 
    waitingCascade = false; // Se desactiva el retraso
    checkPattern(); // Se buscan nuevos patrones
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
  if (!swapAnimation) return; // Sin valores de animación, no hace acción alguna

  let elapsed = millis() - swapAnimation.startTime; // se calcula el tiempo desde el inicio de la animación

  if (elapsed >= animationDuration) { // La animación a terminado si el tiempo transcurrido es mayor o igual a la duración
    if (swapAnimation.reverse) { // Se asignan los dulces a sus posiciones originales si no hubo coincidencias en el intercambio
      board.fill(swapAnimation.r1, swapAnimation.c1, swapAnimation.candy1);
      board.fill(swapAnimation.r2, swapAnimation.c2, swapAnimation.candy2);
      swapAnimation = null; // Se reinicia la variable de la animación para la siguiente interacción
      selected = null; // Se deselecciona cualquier dulce que este seleccionado
    } else { // Si hubo coincidencias, se aplica el intercambio real en memoria y se buscan patrones
      // Primero se aplica el intercambio real en memoria
      board.fill(swapAnimation.r2, swapAnimation.c2, swapAnimation.candy1);
      board.fill(swapAnimation.r1, swapAnimation.c1, swapAnimation.candy2);
      
      // Guardar posiciones y referencias antes de limpiar la animación
      const r1 = swapAnimation.r1;
      const c1 = swapAnimation.c1;
      const r2 = swapAnimation.r2;
      const c2 = swapAnimation.c2;
      const candy1 = swapAnimation.candy1;
      const candy2 = swapAnimation.candy2;
      
      // Se limpian variables
      swapAnimation = null;
      selected = null;
      
      // se revisa si hay un patrón
      const found = checkPattern();
      
      // Si no hay patron, se inicia la animación de reversa para volver a la posición original
      if (!found) {
        swapAnimation = { // Se retoman las variables de la animación para revertir el intercambio
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

function lockRandomCandy() { // Función para bloquear un dulce aleatorio
  let available = []; // Arreglo que almacenará corrdenadas y tipo de dulce que puede ser bloqueado
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let candy = board.read(r, c);
      if (candy && !candy.locked) {
        available.push({ r, c, candy }); // Siempre que haya un dulce que no este bloqueado, este puede ser bloqueado
      }
    }
  }
  if (available.length === 0) return; // Si no hay dulces disponibles para bloquear, no se hace nada
  
  let choice = available[floor(random(available.length))]; // Se elige un dulce aleatorio a bloquear
  choice.candy.locked = true; // se cambia el estado del dulce a bloqueado
}

function mousePressed() {
  if (swapAnimation || gravityAnimating) return; // Si estamos en media animación, ignoramos el click

  switch (gameState) {
    case "menu":
      btnPlay.handleClick(); // Acción menú
      break;

    case "win": // Funcionalidad del click en estado victoria
      btnNextLevel.handleClick();
      break;

    case "playing":
      if (gravityAnimating) return;
      if (swapAnimation) return;

      // Lectura de coordenadas ajustadas por la barra superior de UI
      const r = floor((mouseY - boardY) / Quadrille.cellLength);
      const c = floor((mouseX - boardX) / Quadrille.cellLength);

      if (!board.isValid(r, c) || mouseY < boardY) return;

      let clickedCandy = board.read(r, c); // Leemos qué dulce hay en esa casilla

      // Primer clic
      if (selected === null) {
        let firstCandy = board.read(r, c);
        if (firstCandy && firstCandy.locked) return; // No permitir seleccionar dulce bloqueado
        selected = { r: r, c: c };
        return; // Se finaliza la función para esperar el segundo clic
      }

      // Deseleccionar si tocas la misma pieza
      if (selected.r === r && selected.c === c) {
        selected = null;
        return;
      }

      // Segundo clic
      let secondCandy = board.read(r, c);
      if (secondCandy && secondCandy.locked) {
        selected = null; // Deseleccionar si el objetivo está bloqueado
        return;
      }

      // Una celda es adyacente si está a una distancia de 1 en fila o columna, pero no en ambas
      let isAdjacent = (abs(selected.r - r) === 1 && selected.c === c) ||
        (abs(selected.c - c) === 1 && selected.r === r);

      if (isAdjacent) {
        let candy1 = board.read(selected.r, selected.c); // Almacena dulce seleccionado primer click
        let candy2 = board.read(r, c); // Almacena dulce seleccionado segundo click

<<<<<<< HEAD
        // Activar bomba de color
        if (candy1 && candy1.activate(board, selected.r, selected.c)) {
            selected = null;
            return;
        }
        
        // Hacemos lo mismo para el segundo dulce seleccionado
        if (candy2 && candy2.activate(board, r, c)) {
            selected = null;
            return;
=======
        // Activar bomba de color si se seleccionó una
        if (candy1 && candy1.activate(board, selected.r, selected.c)) {
          selected = null;
          return;
        }
        if (candy2 && candy2.activate(board, r, c)) {
          selected = null;
          return;
>>>>>>> main
        }

        // Diccionario que contedrá los elementos necesarios para la animación de intercambio
        swapAnimation = {
          candy1, candy2,
          r1: selected.r, c1: selected.c,
          r2: r, c2: c,
          dx: (c - selected.c) * Quadrille.cellLength,
          dy: (r - selected.r) * Quadrille.cellLength,
          startTime: millis()
        };
        
        movesSinceLock += 1; // Cada vez que se realiza un intercambio se cuenta un movimieto
        if (movesSinceLock >= lockInterval) { // alcanzada la cantidad de movimientos, se bloquea un dulce
          lockRandomCandy();
          movesSinceLock = 0; // Se reinicia el contador
        }
      }
  }
}

// ==========================================
// DETECCIÓN DE PATRONES Y CREACIÓN DE ESPECIALES
// ==========================================

function addRemovalPosition(toRemove, r, c) { // función que agrega coordenadas de la posición a remover del tablero y suma puntos
  if (r < 0 || r >= rows || c < 0 || c >= cols) return; // Evitar coordenadas inválidas
  
  let exists = toRemove.some(pos => pos.r === r && pos.c === c); // Variable que verifica si existe la coordenada en el arreglo
  if (!exists) { // Si no existe, se agrega la coordenada y se suman puntos
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
      if (candy.kind === "horizontal") { // Eliminar toda la fila si es horizontal
        for (let colIndex = 0; colIndex < cols; colIndex++) {
          addRemovalPosition(expanded, pos.r, colIndex);
        }
      } else if (candy.kind === "vertical") { // Eliminar toda la columna si es vertical
        for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
          addRemovalPosition(expanded, rowIndex, pos.c);
        }
      }
    }
    i++;
  }
  return expanded;
}

function checkPattern() { // Función para buscar patrones en el tablero
  let toRemove = []; // Arreglo para almacenar coordenadas de dulces a elimnar
  let specialsToCreate = []; // Guardará { r, c, type, (kind, candyType) } los nuevos dulces especiales

  // 1. Buscar Coincidencias Horizontales
  for (let r = 0; r < rows; r++) { // Se recorre cada fila
    let runStart = 0; // Variable que indica el inicio de la secuencia de dulces del mismo tipo
    let runType = null; // Variable que indica el tipo de dulce en la secuencia actual

    for (let c = 0; c <= cols; c++) { // Se recorre cada columna y un paso extra para cerrar la secuencia
      let candy = c < cols ? board.read(r, c) : null; // se lee el dulce siempre que no sea final de fila
      let candyType = (candy && candy.type >= 0) ? candy.type : null; // Ignoramos bombas de color (-1)

      if (runType === null) { // si no hay tipo de dulce definido
        if (c < cols && candyType !== null) {
          runType = candyType; // se establece este y donde se empieza a revisar la secuencia
          runStart = c;
        }
      } else if (c === cols || candyType !== runType) { // Si el dulce actual no coincide o si se llega al final
        let matchLength = c - runStart; // Calcular longitud de la coincidencia
        
        if (matchLength >= 3) { // se revisa si la secuencia tiene al menos 3 dulces del mismo tipo
          for (let i = runStart; i < c; i++) { // Se agregan las coordenadas encontradas a la lista
            addRemovalPosition(toRemove, r, i);
          }

          // ¿Crear especial horizontal?
          if (matchLength === 5) { // Patrón de 5 crea una bomba de color
            let centerCol = runStart + 2;
            specialsToCreate.push({ r, c: centerCol, specType: "ColorBomb" });
          } else if (matchLength === 4) { // Patrón de 4 crea un dulce rayado
            let targetCol = c - 1; // Ubicamos el dulce al final de la coincidencia
            specialsToCreate.push({ r, c: targetCol, specType: "Striped", kind: "horizontal", candyType: runType });
          }
        }
        
        if (c < cols && candyType !== null) {
          runType = candyType; // Se actualiza el tipo de dulce
          runStart = c; // y se actualiza la posición de inicio de la secuencia
        } else {
          runType = null;
        }
      }
    }
  }

  // 2. Buscar Coincidencias Verticales
  for (let c = 0; c < cols; c++) { // Lógica idéntica pero aplicada a las columnas
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
  for (let pos of expandedToRemove) { // Se recorren coordenadas almacenadas
    board.fill(pos.r, pos.c, null); // Se eliminan los dulces llenando su posición con null
  }

  // 5. Spawnear los dulces especiales en las casillas correspondientes
  for (let spec of specialsToCreate) {
    if (spec.specType === "ColorBomb") {
      board.fill(spec.r, spec.c, new ColorBomb());
    } else if (spec.specType === "Striped") {
      board.fill(spec.r, spec.c, new specialCandy(spec.candyType, spec.kind));
    }
  }

  // Solo iniciar gravedad si hubo eliminaciones
  if (toRemove.length > 0) {
    gravityAnimating = true;
    return true; // La función retorna true si se encontró al menos una coincidencia
  }
  
  return false; // Si no se encontró ninguna coincidencia, la función retorna false
}

// ==========================================
// GRAVEDAD Y CAÍDA DE DULCES
// ==========================================

function applyGravity() { // Función para aplicar gravedad a los dulces después de eliminaciones
  for (let c = 0; c < cols; c++) { // Se recorre cada columna
    for (let r = rows - 1; r >= 0; r--) { // Se recorre de abajo hacia arriba para aplicar gravedad correctamente
      if (board.read(r, c) === null) { // Si la celda está vacía,
        for (let above = r - 1; above >= 0; above--) { // se busca el primer dulce por encima para caer en esa posición
          let candy = board.read(above, c); // Se lee el dulce encontrado
          
          if (candy !== null) { // si encuentra un dulce
            let distance = r - above; // se calcula una distancia dada la posición del espacio vacio
            board.fill(r, c, candy); // Se mueve el dulce a la posición vacía actual
            board.fill(above, c, null); // Se deja vacía la posición original del dulce
            candy.fallOffsetY = -distance * Quadrille.cellLength; // Se establece el desplazamiento vertical del dulce para la animación
            break; // Se rompe el ciclo para seguir con la siguiente posición vacía
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
        newCandy.fallOffsetY = - (r + 1) * Quadrille.cellLength; // empieza por encima del tablero y caerá hasta su fila
        board.fill(r, c, newCandy);
      }
    }
  }
}

function gravityFinished() {
  for (let r = 0; r < rows; r++) { // Se recorren todos los elementos del board y se revisa si alguno tiene desplazamiento vertical
    for (let c = 0; c < cols; c++) {
      let candy = board.read(r, c);
      if (candy && abs(candy.fallOffsetY) > 0) {
        return false; // Si hay algún dulce con desplazamiento vertical, gravedad no ha terminado de aplicarse
      }
    }
  }
  return true; // Si no hay desplazamiento vertical en ningún dulce, la gravedad terminó de aplicarse
}