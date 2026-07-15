## Candy Match
# Proyecto 3 – GBG Avanzado: Objetos y Polimorfismo
---
# Deploy Demo
https://juego-candy-match.vercel.app/

# Descripción

Este proyecto consiste en el desarrollo de un videojuego tipo ** Candy Match ** utilizando **JavaScript**, **p5.js** y **p5.quadrille**. El objetivo principal es combinar tres o más dulces del mismo tipo para obtener puntos y superar la puntuación objetivo de cada nivel.

El proyecto fue desarrollado aplicando los principios de **Programación Orientada a Objetos**, haciendo énfasis en el uso de **objetos celda**, **herencia** y **polimorfismo**, además de una arquitectura basada en máquinas de estados para controlar las diferentes pantallas del juego.

---

# Objetivos

- Implementar un videojuego basado en Grid Based Games (GBG).
- Modelar cada celda del tablero mediante objetos con estado y comportamiento encapsulados.
- Aplicar herencia y polimorfismo para representar diferentes tipos de dulces.
- Implementar animaciones para mejorar la experiencia del usuario.
- Desarrollar un sistema de niveles con metas de puntuación.
- Incorporar mecánicas adicionales como bloqueo de dulces y cascadas.

---

# Objetos celda

Cada posición del tablero contiene un objeto que representa un dulce.

## Clase Candy

La clase `Candy` encapsula el estado y comportamiento básico de un dulce.

### Estado

- tipo de dulce
- desplazamiento vertical para animaciones
- estado de bloqueo

### Comportamiento

- dibujar el dulce
- controlar animaciones
- indicar visualmente cuando está seleccionado
- representar si está bloqueado

---

## Clase specialCandy

La clase `specialCandy` hereda de `Candy`.

Esta clase reutiliza el comportamiento general de un dulce, pero redefine el método de dibujo para representar visualmente un dulce especial.

Esto permite mantener una interfaz común para todos los objetos del tablero mientras cada uno posee un comportamiento gráfico diferente.

---

# Polimorfismo

El proyecto implementa polimorfismo mediante el método:

```
display()
```

Todas las celdas del tablero contienen objetos de tipo `Candy`, sin importar si corresponden a un dulce normal o un dulce especial.

Durante el dibujo del tablero, `drawQuadrille()` simplemente invoca:

```
display()
```

sin conocer el tipo específico del objeto.

Cada objeto responde utilizando su propia implementación del método, lo cual constituye una aplicación directa del polimorfismo.

---

# Decisiones de diseño: estrategias de juego implementadas

Se implementaron las siguientes estrategias:

## 1. Generación inteligente del tablero

El tablero inicial evita generar combinaciones automáticas de tres o más dulces utilizando la función:

```
getValidCandy()
```

De esta manera el jugador comienza con un tablero válido.

---

## 2. Intercambio de dulces

Los intercambios únicamente son permitidos entre celdas adyacentes.

Antes de realizar el intercambio definitivo se ejecuta una animación.

Si el movimiento no genera combinaciones, la animación se revierte automáticamente.

---

## 3. Detección de patrones

El sistema identifica:

- combinaciones horizontales
- combinaciones verticales
- patrones tipo L
- patrones tipo T

Estas coincidencias producen la eliminación de dulces y la acumulación de puntos.

---

## 4. Sistema de gravedad

Después de eliminar dulces:

- los dulces superiores caen
- aparecen nuevos dulces
- se generan cascadas automáticas hasta estabilizar el tablero

---

## 5. Sistema de niveles

Cada nivel posee una puntuación objetivo.

Cuando el jugador alcanza la meta:

- aparece una pantalla de victoria
- aumenta el nivel
- aumenta la puntuación requerida
- se reinicia el tablero

---

## 6. Bloqueo aleatorio

Cada cierto número de movimientos se bloquea un dulce aleatorio.

Los dulces bloqueados:

- no pueden seleccionarse
- no pueden intercambiarse
- muestran un indicador visual

Esta mecánica incrementa la dificultad del juego.

---

# Arquitectura del proyecto

El programa está organizado mediante una máquina de estados.

Estados implementados:

- Menu
- Playing
- Win

Cada estado posee su propia pantalla y comportamiento independiente.

---

# Resultados

Se obtuvo un juego funcional que incluye:

- tablero dinámico
- animaciones de intercambio
- animaciones de gravedad
- sistema de puntuación
- múltiples niveles
- bloqueo de dulces
- generación automática de nuevas piezas
- detección de patrones
- cascadas automáticas

Además, el proyecto demuestra el uso de Programación Orientada a Objetos mediante encapsulamiento, herencia y polimorfismo.

---

# Trabajos futuros

Como posibles mejoras se proponen:

- Implementar diferentes tipos de dulces especiales.
- Añadir bombas y combinaciones avanzadas.
- Incorporar efectos de sonido y música.
- Agregar temporizador o límite de movimientos.
- Implementar un sistema de vidas.
- Crear niveles con objetivos específicos.
- Mejorar las animaciones utilizando interpolaciones más complejas.
- Guardar el progreso del jugador.

---

# APIs utilizadas

## JavaScript

- Clases (`class`)
- Herencia (`extends`)
- Polimorfismo
- Arrays
- Objetos
- Funciones flecha
- Math
- Condicionales
- Ciclos

---

## p5.js

- createCanvas()
- draw()
- preload()
- mousePressed()
- image()
- color()
- fill()
- stroke()
- text()
- circle()
- rect()
- translate()
- push()
- pop()
- lerp()
- random()
- floor()
- millis()

Documentación:

https://p5js.org/reference/
https://gbgs.gitlab.io/
---

## p5.quadrille

- createQuadrille()
- drawQuadrille()
- Quadrille.cellLength
- board.read()
- board.fill()
- board.clear()
- board.isValid()

Repositorio:

https://github.com/kulcue-hash/proyecto3_juego

---

# AI Usage Declaration

**Tool(s):**
ChatGPT (OpenAI)

**Purpose:**
Apoyo en la revisión del código, explicación de conceptos de Programación Orientada a Objetos y asistencia durante el desarrollo.

**Extent:**
La IA fue utilizada como herramienta de apoyo para comprender conceptos, mejorar la estructura del código y redactar la documentación. Todas las decisiones de diseño, implementación y pruebas fueron realizadas y verificadas por el equipo.

**Validation:**
Cada sugerencia proporcionada por la IA fue revisada, adaptada y validada mediante pruebas de funcionamiento antes de ser incorporada al proyecto.

### Aclaraciones finales

Este proyecto fue desarrollado exclusivamente con fines académicos como parte de una actividad universitaria.

Algunos recursos gráficos utilizados, como imágenes o elementos visuales inspirados en la franquicia **Candy Crush**, pertenecen a sus respectivos propietarios y se emplean únicamente con fines ilustrativos para recrear la experiencia del juego durante el desarrollo del proyecto.

Este trabajo no tiene fines comerciales, no pretende atribuirse la propiedad intelectual de dichos recursos ni distribuirlos con fines de lucro. Todos los derechos sobre las imágenes, diseños y demás elementos protegidos por derechos de autor pertenecen a sus respectivos titulares.

Candy Crush es una marca registrada y una propiedad intelectual de King Digital Entertainment. Este proyecto no está afiliado, respaldado ni patrocinado por dicha empresa

### Integrantes
- Sergio Andres Mora -smoraro@unal.edu.co
- Rafael Arturo Forero - raforeros@unal.edu.co
- Andres Felipe Martinez - amartinezroa@unal.edu.co
- Karen Marisol Ulcue - kulcue@unal.edu.co
