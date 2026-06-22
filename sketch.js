//// Andrés Felipe Martínez



let board; // Definición de pantalla de juego
const rows = 8; // Definición de tamaño de tablero
const cols = 8;
let candyColors; // Arreglo para almacenar los colores de los dulces
let selected = null; // Variable para almacenar la posición del primer dulce seleccionado
let points = 0; // Variable para almacenar puntos en cada revisión

// Variables para animaciones
let swapAnimation = null; // Variable para almacenar información de animación de intercambio
let gravityAnimating = false; // Variable para indicar si se está aplicando la animación de gravedad
let waitingCascade = false; // retraso aplicado antes de buscar nuevos patrones después de aplicar gravedad
let cascadeStartTime = 0; // Se guarda cuando empezó dicho retraso para posterior medida 
const cascadeDelay = 800; // tiempo en milisegundos antes de buscar nuevos patrones 
let animationDuration = 250; // Se define duración de la animación ms

// CLASE CANDY - Estrategia de Objetos de Celda
class Candy {
  constructor(type) {
    this.type = type; // Índice del color del dulce
    this.fallOffsetY = 0; // Variable para almacenar desplazamiento vertical durante caidas
  }

  display({ row, col }) {
    let cellLength = Quadrille.cellLength;

    let offsetX = 0; // Variables para almacenar el desplazamiento actual del dulce durante la animación
    let offsetY = this.fallOffsetY;

    // Animación de caída
    if (abs(this.fallOffsetY) > 0.5) { //Al lerp interpolar hacia cero, podrían tenerse valores negativos. Cuando se llega a un valor lo suficientemente cercano a cero, se establece el desplazamiento en cero para finalizar

      this.fallOffsetY =
        lerp(this.fallOffsetY, 0, 0.1); // Interpolación lineal, falloffsetY se mueve un 10% del camino hacia cero cada frame, creando un efecto de desaceleración a medida que se acerca al destino final

    } else {

      this.fallOffsetY = 0;
    }

    // Si existe una animación activa
    if (swapAnimation) {

      let t = constrain( // Normalización del tiempo transcurrido desde el inicio de la animación
        (millis() - swapAnimation.startTime) /
        animationDuration,
        0,
        1 // El valor de t va de 0 a 1 durante la animación, lo que permite interpolar el movimiento de los dulces
      );

      // Dulce que sale desde la celda seleccionada
      if (this === swapAnimation.candy1) {
        offsetX = lerp(0, swapAnimation.dx, t); // Interpolación lineal para calcular el desplazamiento actual en x e y dependiendo el tiempo transcurrido
        offsetY += lerp(0, swapAnimation.dy, t);
      }

      // Dulce que sale desde la segunda celda
      if (this === swapAnimation.candy2) { // Para el segundo dulce el desplazamiento será en sentido contrario
        offsetX = lerp(0, -swapAnimation.dx, t);
        offsetY += lerp(0, -swapAnimation.dy, t);
      }
    }

    push(); // Guardar estado actual de transformación

    translate(offsetX, offsetY); //Cambio de sistema de coordenadas para aplicar el desplazamiento durante la animación

    // Se le asigna el color correspondiente al tipo de dulce
    fill(candyColors[this.type]);
    // Si esta celda coincide con la seleccionada, le ponemos borde
    if (selected && selected.r === row && selected.c === col) {
      stroke(0);
      strokeWeight(6);
    } else {
      noStroke();
    }

    //Se dibuja el ciruculo dado el centro relativo
    circle(cellLength / 2, cellLength / 2, cellLength * 0.8);

    pop(); // Restaurar estado de transformación para no afectar otros elementos dibujados en la celda o en otras celdas
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

//SETUP
function setup() {
  // Tamaño de cada celda
  Quadrille.cellLength = 60;

  // Se crea el lienzo dependiendo del tamaño de la celda y de la cantidad de celdas
  createCanvas(cols * Quadrille.cellLength, rows * Quadrille.cellLength);

  // Definimos los 5 colores para los dulces
  candyColors = [color(255, 50, 50), color(50, 255, 50), color(50, 100, 255), color(255, 255, 50), color(200, 50, 255)]; // Rojo, verde, azul, amarillo, morado   

  // Una sola cuadrícula para el juego(estados agregados)
  board = createQuadrille(cols, rows);

  // Se llena el tablero con instancias del objeto Candy de forma inteligente sin patrones iniciales
  for (let r = 0; r < rows; r++) { //Se recorre cada fila
    for (let c = 0; c < cols; c++) { // Se recorre cada columna
      let validType = getValidCandy(r, c); // Se obtiene un tipo de dulce válido para la posición actual
      board.fill(r, c, new Candy(validType)); // Se llena la posición actual del tablero con el tipo de dulce
    }
  }
}


function draw() {

  background(40); // Fondo del juego
  drawQuadrille(board);  // Dibujo del tablero con los objetos Candy, cada uno se dibuja según su método display
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
}

// Función para actualizar la animación de intercambio
function updateAnimation() {

  if (!swapAnimation) return; // Si no hay valores de animación, no se hace nada
  let elapsed = millis() - swapAnimation.startTime; // Se calcula el tiempo transcurrido desde el inicio de la animación
  if (elapsed >= animationDuration) { // Si el tiempo transcurrido supera la duración definida, se finaliza la animación realizando el intercambio real en memoria y se verifica si se formaron patrones

    // Intercambio real en memoria
    board.fill(swapAnimation.r2, swapAnimation.c2, swapAnimation.candy1);
    board.fill(swapAnimation.r1, swapAnimation.c1, swapAnimation.candy2);
    swapAnimation = null;
    // Verificación de patrones después del intercambio
    checkPattern();
  }
}

// Intercambio de dulces
function mousePressed() {

  // No permitir clics durante la animación
  if (gravityAnimating) return;
  if (swapAnimation) return;
  // Lectura de coordenadas de celda
  const r = board.mouseRow;
  const c = board.mouseCol;
  //Si el click no está dentro de los limites del tablero, no se hace nada
  if (!board.isValid(r, c)) return;

  // Primer clic
  if (selected === null) {
    selected = { r: r, c: c };
    return; // Se finaliza la función para esperar el segundo clic
  }

  // Segundo clic
  // Una celda es adyacente si está a una distancia de 1 en fila o columna, pero no en ambas
  let isAdjacent = (abs(selected.r - r) === 1 && selected.c === c) ||
    (abs(selected.c - c) === 1 && selected.r === r);

  if (isAdjacent) {

    let candy1 = board.read(selected.r, selected.c); //Almcena dulce seleccionado primer click
    let candy2 = board.read(r, c); //Almacena dulce seleccionado segundo click

    //Diccionario que contedrá los elementos necesarios para la animación de intercambio
    swapAnimation = {
      candy1, // Elementos a animar
      candy2,
      r1: selected.r, // Posicion del primer dulce
      c1: selected.c,
      r2: r, // Posicion del segundo dulce
      c2: c,
      dx: (c - selected.c) * Quadrille.cellLength, // Distancia a recorrer en x
      dy: (r - selected.r) * Quadrille.cellLength, // Distancia a recorrer en y
      startTime: millis() // Tiempo de inicio de la animación
    };
  }

  selected = null; // Reinicio de variable para próximo intercambio 
}

//Detección de patrones
function addUnique(toRemove, r, c) { // Función auxiliar para identificar posiciones ya agregadas al arreglo de elementos a remover
  let exists = toRemove.some(
    pos => pos.r === r && pos.c === c
  ); // Se verifica si la posición ya existe en el arreglo

  if (!exists) {
    toRemove.push({ r, c });
    points += 10;
  } //Si no existe, se agrega al arreglo
}

//Función principal para detectar patrones
function checkPattern() {
  points = 0; // Reinicio de puntos para el conteo actual
  let toRemove = []; //Arreglo para almacenar coordenadas de dulces a elimnar

  // Buscar horizontal
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - 3; c++) { //Se busca hasta cols - 3 dado que para los 2 ultimos elementos no existen 3 elementos consecutivos
      let candy1 = board.read(r, c);
      let candy2 = board.read(r, c + 1);
      let candy3 = board.read(r, c + 2); //Se leen los 3 dulces consecutivos

      if (candy1 && candy2 && candy3 && candy1.type === candy2.type && candy2.type === candy3.type) { //Si son iguales
        addUnique(toRemove, r, c);
        addUnique(toRemove, r, c + 1);
        addUnique(toRemove, r, c + 2); // Se agregan al arreglo de elementos a eliminar
      }
    }
  }

  // Buscar vertical
  for (let c = 0; c < cols; c++) { // Lógica similar a la búsqueda horizontal

    for (let r = 0; r <= rows - 3; r++) {
      let candy1 = board.read(r, c);
      let candy2 = board.read(r + 1, c);
      let candy3 = board.read(r + 2, c);

      if (candy1 && candy2 && candy3 && candy1.type === candy2.type && candy2.type === candy3.type) {
        addUnique(toRemove, r, c);
        addUnique(toRemove, r + 1, c);
        addUnique(toRemove, r + 2, c);
      }
    }
  }
  //Eliminar dulces
  for (let pos of toRemove) { //Se recorren coordenadas almacenadas

    board.fill( //Se eliminan los dulces llenando su posición con null
      pos.r,
      pos.c,
      null
    );
  }
  // Solo iniciar gravedad si hubo eliminaciones
  if (toRemove.length > 0) {
    gravityAnimating = true;
  }
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