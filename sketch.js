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
let candyImages = []; // Arreglo para almacenar imágenes de dulces
let lastPatternInfo = null;

function preload() {

  menuBackground = loadImage("menu.jpg");
  gameBackground = loadImage("canva.jpeg");
  bombImage = loadImage("SpecialCandies/ColorBomb.png");
  candyImages[0] = loadImage("Candyred.png");
  candyImages[1] = loadImage("candyGreen.png");
  candyImages[2] = loadImage("candyBlue.png");
  candyImages[3] = loadImage("candyYellow.png");
  candyImages[4] = loadImage("candyPurple.png");
 
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
    this.radius = 12;
  }

  show() {
    let isHover = this.isHover(mouseX, mouseY);

    //Si esta en el boton el mouse que sea gris
    if (isHover) {
      fill(255, 150); // Un poco más brillante en hover
    }
    // sino esta que este normal
    else {
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
    this.locked = false; // Si el dulce está bloqueado y no se puede mover
  }

  display({ row, col }) {
    let cellLength = Quadrille.cellLength;
    let offsetX = 0; // Se aplica el desplazamiento horizontal para la animación de intercambio
    let offsetY = this.fallOffsetY; // Se aplica el desplazamiento vertical para la animación de caída

    // Animación de caída
    if (abs(this.fallOffsetY) > 0.1) { //Siempre que el desplazamiento vertical sea mayor a 0.1, se aplica la animación de caída
      this.fallOffsetY = lerp(this.fallOffsetY, 0, 0.1); //Lerp interpola entre el valor actual y 0 para suavizar la animación de caída
    } else { // si el desplazamiento vertical es menor a 0.1, se establece en 0 para evitar valores negativos de posición
      this.fallOffsetY = 0;
    }

    // Si existe una animación activa
    if (swapAnimation) { // con la interacción del mouse, se tienen definidas variables en swapAnimation
      let t = constrain((millis() - swapAnimation.startTime) / animationDuration, 0, 1); // Se establece un porcentaje de progreso que definirá la posición del dulce

      if (swapAnimation.reverse) { //Cuando en un intercambio no hay coincidencias, reverse indica que debe revertirse la posición de los dulces visualmente
        if (this === swapAnimation.candy1) {
          offsetX = lerp(0, -swapAnimation.dx, t); //Interpolación de la posición horizontal dado el porcentaje de progreso t
          offsetY += lerp(0, -swapAnimation.dy, t); // Interpolación de la posición vertical dado el porcentaje de progreso t
        }
        if (this === swapAnimation.candy2) {
          offsetX = lerp(0, swapAnimation.dx, t);
          offsetY += lerp(0, swapAnimation.dy, t);
        }
      } else {
        if (this === swapAnimation.candy1) { //Cuando en un intercambio hay coincidencias, se aplica la animación de intercambio normal
          offsetX = lerp(0, swapAnimation.dx, t);
          offsetY += lerp(0, swapAnimation.dy, t);
        }
        if (this === swapAnimation.candy2) {
          offsetX = lerp(0, -swapAnimation.dx, t);
          offsetY += lerp(0, -swapAnimation.dy, t);
        }
      }
    }

    push();
    // Establecimiento de posición relativa a los desplazamientos
    translate(offsetX, offsetY);

    // Se dibuja el dulce con su color correspondiente
    fill(candyColors[this.type]);
    // Si el dulce está seleccionado, se dibuja un contorno blanco alrededor de él
    if (selected && selected.r === row && selected.c === col){
    stroke(255);
    strokeWeight(4);
    noFill();
    circle(
        cellLength/2,
        cellLength/2,
        cellLength*0.9
    );
}
imageMode(CENTER);// Se establece el modo de dibujo de imágenes al centro para que la imagen del dulce se dibuje centrada en la celda
image(
    candyImages[this.type],
    cellLength/2,
    cellLength/2,
    cellLength*0.85,
    cellLength*0.85
);

    if (this.locked) { //Indicador visual de bloqueo
      noStroke();
      fill(255);
      rectMode(CENTER);
      rect(cellLength / 2, cellLength / 2, cellLength * 0.3, cellLength * 0.3);
    }
    pop();
  }
  activate(board){
        // Un dulce normal no hace nada
    }
}

// Implementación de Herencias para dulces especiales
class specialCandy extends Candy {
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
// Si el dulce está seleccionado, se dibuja un contorno blanco alrededor de él
    if (selected && selected.r === row && selected.c === col){
    stroke(255);
    strokeWeight(4);
    noFill();
    circle(
        cellLength/2,
        cellLength/2,
        cellLength*0.9
    );
}
imageMode(CENTER);// Se establece el modo de dibujo de imágenes al centro para que la imagen del dulce se dibuje centrada en la celda
image(
    candyImages[this.type],
    cellLength/2,
    cellLength/2,
    cellLength*0.85,
    cellLength*0.85
);

    //EFECTO VISUAL DEL DULCE ESPECIAL
    fill(255, 200);
    noStroke();
    rectMode(CENTER);
    rect(cellLength / 2, cellLength / 2, cellLength * 0.3, cellLength * 0.3);
    pop();
  }
}

// CLASE BOMBA DE COLOR (HEREDA DE CANDY)
class ColorBomb extends Candy{
  constructor(){
    // Llamada al constructor de la clase padre con un tipo especial (-1) para indicar que es una bomba de color
    super(-1);
  }
  display({row,col}){
    let cellLength = Quadrille.cellLength;
    let offsetX = 0;
    let offsetY = this.fallOffsetY;
    // Animación de caída
    if(abs(this.fallOffsetY)>0.5){
      this.fallOffsetY = lerp(this.fallOffsetY,0,0.1);
    }
    else{
      this.fallOffsetY = 0;
    }
    // Animación de intercambio
    if(swapAnimation){
      let t = constrain(
        (millis()-swapAnimation.startTime)/animationDuration,
        0,1);
      if(this===swapAnimation.candy1){
        offsetX = lerp(0,swapAnimation.dx,t);
        offsetY += lerp(0,swapAnimation.dy,t);
      }
      if(this===swapAnimation.candy2){
        offsetX = lerp(0,-swapAnimation.dx,t);
        offsetY += lerp(0,-swapAnimation.dy,t);
      }
    }
    push();
    translate(offsetX,offsetY);
    imageMode(CENTER);
    image(
      bombImage,
      cellLength/2,
      cellLength/2,
      cellLength*0.90,
      cellLength*0.90
  );
    pop();
  }
  explode(){
    let destroyed = 0;
    while(destroyed < 20){
        let rr = floor(random(rows));
        let cc = floor(random(cols));

        let candy = board.read(rr,cc);
        if(
            candy != null &&
            !(candy instanceof ColorBomb)
        ){
            board.fill(rr,cc,null);
            destroyed++;
            points += 10;
        }
    }
    gravityAnimating = true;
}
}

// Función para obtener un tipo de dulce válido que no forme patrones
function getValidCandy(row, col) {
  let validTypes = []; // Arreglo para almacenar tipos válidos para la posición actual
  for (let type = 0; type < candyColors.length; type++) { // Se itera sobre cada tipo de dulce
    let isValid = true; // Variable que verifica si el tipo de dulce actual es válido

    // Verificar horizontal (3 en línea hacia la izquierda)
    if (col >= 2) { // Si estamos en una posición mayor a la tercera columna
      let c1 = board.read(row, col - 1); // SE leen los dos dulces a la izquierda de la posición actual
      let c2 = board.read(row, col - 2);
      if (c1 && c2 && c1.type === type && c2.type === type) {
        isValid = false; // Si hay coincidencia en el tipo, el dulce revisado no es válido para esa posición
      }
    }
    // Verificar vertical (3 en línea hacia arriba)
    if (isValid && row >= 2) { // Si estamos en una posición mayor a la tercera fila
      let c1 = board.read(row - 1, col); // Se leen los dos dulces por encima de la posición actual
      let c2 = board.read(row - 2, col);
      if (c1 && c2 && c1.type === type && c2.type === type) {
        isValid = false; // Si hay coincidencia en el tipo, el dulce revisado no es válido para esa posición
      }
    }

    if (isValid) {
      validTypes.push(type); // Siempre que sea válido el dulce, se guarda su tipo
    }
  }
  // Siempre que haya almenos un tipo de dulce válido, se retorna uno de los válidos aleatoriamente
  return validTypes[floor(random(validTypes.length))];
}

// SETUP
function setup() {
  Quadrille.cellLength = 60;
  // Hacemos el canvas un poco más alto para poner UI arriba
  createCanvas(windowWidth, windowHeight);
  candyColors = [color(255, 50, 50), color(50, 255, 50), color(50, 100, 255), color(255, 255, 50), color(200, 50, 255)];

  board = createQuadrille(cols, rows);
  initBoard(); // Llenamos el tablero
  createButtons(); //Se crean los botones
}

// Función separada para poder reiniciar el tablero en cada nivel
function initBoard() {
  board.clear(); // Se limpia el tablero 
  // Se llena el tablero con instancias del objeto Candy de forma inteligente sin patrones iniciales
  for (let r = 0; r < rows; r++) { //Se recorre cada fila
    for (let c = 0; c < cols; c++) { // Se recorre cada columna
      let validType = getValidCandy(r, c); // Se obtiene un tipo de dulce válido para la posición actual
      board.fill(r, c, new Candy(validType)); // Se llena la posición actual del tablero con el tipo de dulce
    }
  }
}

function draw() {
  switch (gameState) {// Maquina de estados para dibujar la pantalla correspondiente según el estado actual del juego
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

  btnPlay.show();
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

  btnNextLevel.show();
}

function drawPlaying() {

  image(menuBackground, 0, 0, width, height);
  boardX = (width - cols * Quadrille.cellLength) / 2;
  boardY = 140;
  //UI del Juego 
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

  fill(0, 0, 0, 110);   // blanco con transparencia
  stroke(255, 120);
  strokeWeight(2);
  rect(boardX, boardY, cols * Quadrille.cellLength, rows * Quadrille.cellLength, 0); // Fondo del tablero con bordes redondeados
  pop();

  push();
  translate(boardX, boardY); // Desplazamos el tablero hacia abajo para dejar espacio a la UI
  drawQuadrille(board);
  updateAnimation(); // Siempre que haya un intercambio en proceso, se actualiza la animación

  if (gravityAnimating) { // Dada la eliminación de dulces, se inicia la animación de gravedad
    applyGravity(); //llamando a la función
    if (gravityFinished()) { //Se verifica si la animiación de gravedad a finalizado
      gravityAnimating = false; // Se indica que no se está aplicando la gravedad
      waitingCascade = true; // Se inicia retraso antes de buscar nuevos patrones
      cascadeStartTime = millis(); // Se guarda el tiempo de inicio del retraso para posterior medida
    }
  }

  if (waitingCascade && millis() - cascadeStartTime > cascadeDelay) { //Si esta activo el retraso y el tiempo transcurrido es mayor al definido, se busca nuevos patrones formados por la caída de los dulces
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
  if (!swapAnimation) return; //Sin valores de animación, no hace acción alguna

  let elapsed = millis() - swapAnimation.startTime; // se calcula el tiempo desde el inicio de la animación hasta el momento actual

  if (elapsed >= animationDuration) { //La animación a terminado si el tiempo transcurrido es mayor o igual a la duración de la animación
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
      //Se limpian variables
      swapAnimation = null;
      selected = null;
      //se revisa si hay un patrón
      const found = checkPattern();
      //Si no hay patron, se inicia la animación de reversa para volver a la posición original
      if (!found) {
        swapAnimation = { //Se retoman las variables de la animación para revertir el intercambio
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
  let available = []; //Arreglo que almacenará corrdenadas y tipo de dulce que puede ser bloqueado
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
  choice.candy.locked = true; //se cambia el estado del dulce a bloqueado
}

function mousePressed() {
  if (swapAnimation || gravityAnimating) return;

  switch (gameState) {

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
        let candy1 = board.read(selected.r, selected.c); //Almcena dulce seleccionado primer click
        let candy2 = board.read(r, c); //Almacena dulce seleccionado segundo click

        // Activar bomba de color
        if(candy1 instanceof ColorBomb){
            board.fill(selected.r, selected.c, null);
            candy1.explode();
            selected = null;
            return;
        }
        if(candy2 instanceof ColorBomb){
            board.fill(r, c, null);
            candy2.explode();
            selected = null;
            return;
        }

        //Diccionario que contedrá los elementos necesarios para la animación de intercambio
        swapAnimation = {
          candy1, candy2,
          r1: selected.r, c1: selected.c,
          r2: r, c2: c,
          dx: (c - selected.c) * Quadrille.cellLength,
          dy: (r - selected.r) * Quadrille.cellLength,
          startTime: millis()
        };
        movesSinceLock += 1; //Cada vez que se realiza un intercambio se cuenta un movimieto
        if (movesSinceLock >= lockInterval) { //alcanzada la cantidad de movimientos, se bloquea un dulce
          lockRandomCandy();
          movesSinceLock = 0; // Se reinicia el contador
        }
      }

  }
}

//Detección de patrones
function addRemovalPosition(toRemove, r, c) { //función que agrega coordenadas de la posición a remover del tablero y suma puntos
  let exists = toRemove.some(pos => pos.r === r && pos.c === c); //Variable que verifica si existe la coordenada en el arreglo
  if (!exists) { //Si no existe, se agrega la coordenada y se suman puntos
    toRemove.push({ r, c });
    points += 10;
  }
}

function setPatternInfo(kind, count, positions) {//Función que guarda información del último patrón encontrado para identificar el tipo y las coordenadas
  lastPatternInfo = { kind, count, positions }; //Con esta información, al eliminar, se puede identificar cuando crear un dulce especial
}

function setPatternInfo(kind, count, positions) {//Función que guarda información del último patrón encontrado para identificar el tipo y las coordenadas
  lastPatternInfo = { kind, count, positions }; //Con esta información, al eliminar, se puede identificar cuando crear un dulce especial
}

function checkPattern() { // Función para buscar patrones en el tablero
  let toRemove = []; //Arreglo para almacenar coordenadas de dulces a elimnar
  lastPatternInfo = null; // Variable para almacenar información del último patrón encontrado

  // Buscar horizontal
  for (let r = 0; r < rows; r++) { // Se recorre cada fila
    let runStart = 0; // Variable que indica el inicio de la secuencia de dulces del mismo tipo
    let runType = null; // Variable que indica el tipo de dulce en la secuencia actual

    for (let c = 0; c <= cols; c++) { // Se recorre cada columna y un paso extra para cerrar la secuencia al final
      let candy = c < cols ? board.read(r, c) : null; // se lee el dulce en la posición actual siempre que no se haya llegado al final de la fila, si se llega al final, se asigna null para cerrar la secuencia

      if (runType === null) { // si no hay tipo de dulce definido, 
        if (c < cols) {
          runType = candy.type; // se establece este y donde se empieza a revisar la secuencia
          runStart = c;
        }
      } else if (c === cols || candy.type !== runType) { // Si ya hay un tipo definido y el dulce actual no coincide o si se llega al final de la fila
        if (c - runStart >= 3) { // se revisa si la secuencia tiene al menos 3 dulces del mismo tipo
          let positions = []; // Se define arreglo para almacenar las coordenadas de los dulces
          for (let i = runStart; i < c; i++) { // Se agregan las coordenadas encontradas a la lista de arreglos a eliminar 
            addRemovalPosition(toRemove, r, i);
            positions.push({ r, c: i }); // Se agregan las coordenadas encontradas a la lista de posiciones del patrón
          }
          if (positions.length >= 4 && (!lastPatternInfo || positions.length > lastPatternInfo.count)) {
            setPatternInfo("línea", positions.length, positions); // se guarda el patrón mas grande encontrado hasta el momento, para identificar si se debe crear un dulce especial
          }
        }
        if (c < cols) {
          runType = candy.type; // Se actualiza el tipo de dulce cuando no se encuentra coincidencia
          runStart = c; // y se actualiza la posición de inicio de la secuencia
        }
      }
    }
  }

  // Buscar vertical
  for (let c = 0; c < cols; c++) {
    let runStart = 0;
    let runType = null;

    for (let r = 0; r <= rows; r++) {
      let candy = r < rows ? board.read(r, c) : null;

      if (runType === null) {
        if (r < rows) {
          runType = candy.type;
          runStart = r;
        }
      } else if (r === rows || candy.type !== runType) {
        if (r - runStart >= 3) {
          let positions = [];
          for (let i = runStart; i < r; i++) {
            addRemovalPosition(toRemove, i, c);
            positions.push({ r: i, c });
          }
          if (positions.length >= 4 && (!lastPatternInfo || positions.length > lastPatternInfo.count)) {
            setPatternInfo("línea", positions.length, positions);
          }
        }
        if (r < rows) {
          runType = candy.type;
          runStart = r;
        }
      }
    }
  }

  // Buscar patrones tipo L o T de 5 dulces
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 2; c++) {
      let firstCandy = board.read(r, c);
      if (!firstCandy) continue;

      let positions = [];
      let targetType = firstCandy.type;

      for (let rr = r; rr < r + 2; rr++) {
        for (let cc = c; cc < c + 3; cc++) {
          let candy = board.read(rr, cc);
          if (candy && candy.type === targetType) {
            positions.push({ r: rr, c: cc });
          }
        }
      }

      if (positions.length === 5) {
        let isStraight = positions.every(pos => pos.r === positions[0].r) || positions.every(pos => pos.c === positions[0].c);
        if (!isStraight) {
          for (let pos of positions) {
            addRemovalPosition(toRemove, pos.r, pos.c);
          }
          setPatternInfo("L/T", 5, positions);
        }
      }
    }
  }
// Crear bomba de color si se encontró una línea de 5
let bombPosition = null;

if (
    lastPatternInfo &&
    lastPatternInfo.kind === "línea" &&
    lastPatternInfo.count === 5
){

    bombPosition = lastPatternInfo.positions[2];// Se elige la posición central de la línea para colocar la bomba
}
  //Eliminar dulces
  for (let pos of toRemove) {
    // Si esta posición será la bomba
    if (
        bombPosition &&
        pos.r === bombPosition.r &&
        pos.c === bombPosition.c
    ){
        board.fill(
            pos.r,
            pos.c,
            new ColorBomb()
        )
    }
    // Dulce normal
    else{
        board.fill(
            pos.r,
            pos.c,
            null
        );
    }
}
  // Solo iniciar gravedad si hubo eliminaciones
  if (toRemove.length > 0) {
    gravityAnimating = true;
    return true; // La función retorna true si se encontró al menos una coincidencia
  }
  return false; //Si no se encontró ninguna coincidencia, la función retorna false
  // Este booleano es empleado para si se revierte o no un intercambio 
}

function applyGravity() { // Función para aplicar gravedad a los dulces después de eliminaciones
  for (let c = 0; c < cols; c++) { // Se recorre cada columna
    for (let r = rows - 1; r >= 0; r--) { // Se recorre de abajo hacia arriba para aplicar gravedad correctamente
      if (board.read(r, c) === null) { // Si la celda está vacía, 
        for (let above = r - 1; above >= 0; above--) { //se busca el primer dulce por encima para caer en esa posición
          let candy = board.read(above, c); // Se lee el dulce encontrado
          if (candy !== null) { //si encuentra un dulce

            let distance = r - above; // se calcula una distancia dada la posición del espacio vacio y la posición del siguiente dulce encontrado por arriba
            board.fill(r, c, candy); // Se mueve el dulce a la posición vacía actual
            board.fill(above, c, null); // Se deja vacía la posición original del dulce
            candy.fallOffsetY = -distance * Quadrille.cellLength; // Se establece el desplazamiento vertical del dulce para la animación de caída 
            break; //Se rompe el ciclo para seguir con la siguiente posición vacía, ya que ya se movió el dulce más cercano por encima y debe seguirse buscando mas dulces en la misma columna por encima
          }
        }
      }
    }
  }

  // Rellenar los huecos restantes con nuevos dulces que vienen desde arriba (aleatorios)
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
  for (let r = 0; r < rows; r++) { //Se recorren todos los elementos del board y se revisa si alguno tiene desplazamiento vertical
    for (let c = 0; c < cols; c++) {
      let candy = board.read(r, c);
      if (candy && abs(candy.fallOffsetY) > 0) {
        return false; // Si hay algún dulce con desplazamiento vertical, gravedad no ha terminado de aplicarse
      }
    }
  }
  return true; // Si no hay desplazamiento vertical en ningún dulce, la gravedad terminó de aplicarse 
}
