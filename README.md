# 🎨 ModCraft Studio

**ModCraft Studio** es una suite web local diseñada específicamente para editar y gestionar todos los assets de tus mods de Minecraft (`mine-mods/`) de forma cómoda, visual y rápida, sin necesidad de compilar paquetes pesados ni configuraciones complejas.

---

## 🚀 Cómo Iniciar la Interfaz

Solo necesitas ejecutar el script en tu terminal:

```bash
cd /home/alex/side
./start-studio.sh
```

*(O si prefieres especificar otro puerto, por ejemplo el 8080: `python3 mod-studio/backend/server.py 8080`)*

Luego, abre en tu navegador favorito:
👉 **[http://localhost:8080](http://localhost:8080)** *(o http://localhost:8000 si está libre)*

---

## 🛠️ Herramientas Incluidas

### 1. 🎨 Editor de Texturas & Pixel Art
* **Canvas Pixelado Especializado:** Zoom fluido (de 4x a 48x) con rueda de ratón o botones, cuadrícula de píxeles intercambiable y coordenadas en tiempo real (X, Y).
* **Herramientas de Dibujo:**
  * ✏️ **Lápiz** (grosor de 1px a 3px).
  * 🧹 **Borrador** con canal alfa.
  * 💉 **Gotero (Pipeta)** para tomar colores directamente del canvas.
  * 🪣 **Bote de Pintura (Flood Fill)** para rellenar áreas contiguas.
  * ☀️ **Aclarar (Dodge) & 🌙 Oscurecer (Burn):** Herramienta esencial para añadir sombreados y volumen al estilo auténtico de Minecraft.
* **Paletas de Color:**
  * Selector RGBA con control de opacidad.
  * Historial de colores recientes.
  * Paleta estándar de materiales de Minecraft.
  * Paleta dinámica extraída automáticamente de la textura activa.
* **Capa Trim / Overlay:** Previsualización de capas superpuestas (útil para verificar cómo lucen trims, armaduras o detalles sobre la textura base).
* **Guardado Directo:** Guarda directamente sobre el archivo PNG del mod (`Ctrl+S`) o descarga una copia PNG.
* **Historial Completo:** Deshacer (`Ctrl+Z`) y Rehacer (`Ctrl+Y`).

---

### 2. 🌐 Gestor de Idiomas (Localización / Lang)
* **Tabla Matricial Sincronizada:** Alinea todas las claves de traducción en filas y muestra cada idioma (`en_us.json`, `es_es.json`, `es_ar.json`, etc.) en columnas contiguas.
* **Detección de Faltantes:** Resalta en color ámbar las traducciones faltantes y permite activar el filtro *"Mostrar solo incompletas"*.
* **Búsqueda Instantánea:** Filtra por nombre de clave o por el texto traducido.
* **Gestión Rápida:** Añade nuevas claves globales o incorpora nuevos códigos de idioma (`fr_fr`, `de_de`, `pt_br`) con un solo clic.
* **Guardado en Lote:** Actualiza todos los archivos de idioma simultáneamente preservando formato JSON limpio.

---

### 3. ⚒️ Diseñador Visual de Recetas 3x3
* **Mesa de Crafteo Interactiva:** 9 casillas (3x3) y casilla de resultado con control de cantidad.
  * *Clic izquierdo:* coloca el ítem seleccionado.
  * *Clic derecho:* vacía la casilla.
* **Catálogo de Ítems Integrado:**
  * Pestaña con todos los ítems y texturas detectados en tu propio mod.
  * Pestaña con los ítems más comunes de Minecraft (lingotes, madera, horno, lana, etc.).
  * Campo personalizado para cualquier ID con namespace (`minecraft:...` o `garage:...`).
* **Soporte de Formatos:** Genera recetas `minecraft:crafting_shaped` (con patrón y claves de letras) o `minecraft:crafting_shapeless`.
* **Carga y Edición:** Lee las recetas ya existentes en `data/<mod>/recipe/` para editarlas visualmente.
* **Guardado Directo:** Genera y guarda el archivo JSON listo para Minecraft 1.21+.

---

### 4. 📦 Inspector de Modelos & JSON
* **Configurador Visual:** Asigna fácilmente el modelo base (`parent`), la capa principal (`layer0`) y la capa de recorte/trim (`layer1`).
* **Previsualización Combinada:** Renderiza en tiempo real las texturas de las capas superpuestas en un canvas 2D.
* **Editor de Código JSON:** Editor integrado con resaltado, botón de formateo automático y validador de sintaxis en tiempo real.

---

### 5. 🗂️ Explorador de Archivos de Recursos
* Árbol completo de la carpeta `src/main/resources/` con filtros rápidos (Texturas, JSON, Lang, Recetas).
* Previsualización instantánea de imágenes y visor/editor para archivos de texto.
* Acceso directo para crear nuevas texturas (16x16 o 32x32 transparentes), nuevos modelos JSON o nuevas recetas a partir de plantillas preconfiguradas.

---

## ⌨️ Atajos de Teclado
* <kbd>Ctrl</kbd> + <kbd>S</kbd>: Guardar archivo activo de la pestaña actual.
* <kbd>Ctrl</kbd> + <kbd>Z</kbd>: Deshacer en el editor de texturas.
* <kbd>Ctrl</kbd> + <kbd>Y</kbd>: Rehacer en el editor de texturas.
* <kbd>P</kbd>: Herramienta Lápiz.
* <kbd>E</kbd>: Herramienta Borrador.
* <kbd>I</kbd>: Gotero / Selector de color.
* <kbd>G</kbd>: Bote de pintura (Relleno).

