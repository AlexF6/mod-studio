// ModCraft Studio - Client Application Logic
(function () {
  'use strict';

  // --- State ---
  const state = {
    currentMod: '',
    mods: [],
    activeTab: 'textures',
    // Textures state
    currentTexturePath: '',
    textureWidth: 16,
    textureHeight: 16,
    zoom: 16,
    tool: 'pen', // 'pen', 'eraser', 'picker', 'bucket', 'lighten', 'darken'
    brushSize: 1,
    primaryColor: '#ff3e3e',
    primaryAlpha: 255,
    showGrid: true,
    undoStack: [],
    redoStack: [],
    maxUndo: 30,
    isDrawing: false,
    recentColors: ['#ffffff', '#000000', '#7f7f7f', '#a0a0a0', '#ff3e3e', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899', '#f97316', '#64748b'],
    currentOverlayImg: null,
    // Lang state
    langData: {},
    langLanguages: [],
    langKeys: [],
    langFiles: {},
    langFilter: '',
    onlyMissing: false,
    // Recipes state
    recipes: [],
    currentRecipeId: '',
    activePaletteItem: 'minecraft:iron_ingot',
    craftGrid: Array(9).fill(null),
    craftResult: { id: '', count: 1 },
    // Models state
    currentModelPath: '',
    modelsList: [],
    // Explorer
    treeData: [],
    explorerFilter: 'all',
    explorerActiveFile: null
  };

  // --- Minecraft Preset Palette ---
  const MINECRAFT_PALETTE = [
    '#ffffff', '#d8d8d8', '#8f8f8f', '#444444', '#181818', '#000000',
    '#5c3c1e', '#855427', '#b5793a', '#d89e5a', '#f4c785', '#fff1c7',
    '#1e3d16', '#2f6323', '#498c36', '#72b849', '#9fd65e', '#ccf285',
    '#162a4d', '#234479', '#3768b4', '#5591e0', '#8ac2ff', '#cbe6ff',
    '#4b1649', '#752573', '#aa39a6', '#d65bcf', '#ea8eee', '#f6c7f8',
    '#4e1717', '#7b2323', '#b33333', '#e05353', '#f28a8a', '#ffc4c4',
    '#5a3a14', '#88581e', '#bd7e2b', '#e6a439', '#fac75c', '#ffea9e'
  ];

  // Common Minecraft items for recipes
  const VANILLA_RECIPE_ITEMS = [
    'minecraft:iron_ingot', 'minecraft:gold_ingot', 'minecraft:copper_ingot', 'minecraft:diamond', 'minecraft:emerald', 'minecraft:netherite_ingot',
    'minecraft:coal', 'minecraft:stick', 'minecraft:string', 'minecraft:leather', 'minecraft:feather',
    'minecraft:furnace', 'minecraft:crafting_table', 'minecraft:chest', 'minecraft:iron_bars', 'minecraft:glass_pane', 'minecraft:glass',
    'minecraft:black_wool', 'minecraft:white_wool', 'minecraft:red_wool', 'minecraft:stone', 'minecraft:cobblestone', 'minecraft:oak_planks',
    'minecraft:redstone', 'minecraft:glowstone_dust', 'minecraft:bucket', 'minecraft:water_bucket', 'minecraft:lava_bucket', 'minecraft:tnt'
  ];

  // --- DOM Elements ---
  const els = {
    modSelect: document.getElementById('modSelect'),
    refreshModsBtn: document.getElementById('refreshModsBtn'),
    navTabs: document.querySelectorAll('.nav-tab'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    globalSaveBtn: document.getElementById('globalSaveBtn'),
    saveStatus: document.getElementById('saveStatus'),
    toast: document.getElementById('toast'),

    // Textures Tab
    textureList: document.getElementById('textureList'),
    textureSearch: document.getElementById('textureSearch'),
    textureTotalCount: document.getElementById('textureTotalCount'),
    btnClearTextureSearch: document.getElementById('btnClearTextureSearch'),
    textureCategoryFilters: document.getElementById('textureCategoryFilters'),
    countCatAll: document.getElementById('countCatAll'),
    countCatItems: document.getElementById('countCatItems'),
    countCatEntities: document.getElementById('countCatEntities'),
    countCatOthers: document.getElementById('countCatOthers'),
    btnNewTexture: document.getElementById('btnNewTexture'),
    btnToggle3D: document.getElementById('btnToggle3D'),
    panel3DViewport: document.getElementById('panel3DViewport'),
    resizer3D: document.getElementById('resizer3D'),
    container3DCanvas: document.getElementById('container3DCanvas'),
    select3DModelOverride: document.getElementById('select3DModelOverride'),
    check3DAutoRotate: document.getElementById('check3DAutoRotate'),
    check3DWireframe: document.getElementById('check3DWireframe'),
    check3DAlphaCutout: document.getElementById('check3DAlphaCutout'),
    check3DScaleBlock: document.getElementById('check3DScaleBlock'),
    check3DSpinWheels: document.getElementById('check3DSpinWheels'),
    slider3DSteer: document.getElementById('slider3DSteer'),
    val3DSteer: document.getElementById('val3DSteer'),
    slider3DLean: document.getElementById('slider3DLean'),
    val3DLean: document.getElementById('val3DLean'),
    btnReset3DPose: document.getElementById('btnReset3DPose'),
    select3DLayers: document.getElementById('select3DLayers'),
    color3DVehicleTint: document.getElementById('color3DVehicleTint'),
    btnExpand3D: document.getElementById('btnExpand3D'),
    btnSnapshot3D: document.getElementById('btnSnapshot3D'),
    btnClose3DViewport: document.getElementById('btnClose3DViewport'),
    hover3DPartBadge: document.getElementById('hover3DPartBadge'),
    mode3DBtns: document.querySelectorAll('.mode-3d-btn'),
    camPresetBtns: document.querySelectorAll('.cam-btn'),
    pixelCanvas: document.getElementById('pixelCanvas'),
    gridCanvas: document.getElementById('gridCanvas'),
    overlayCanvas: document.getElementById('overlayCanvas'),
    canvasViewport: document.getElementById('canvasViewport'),
    canvasWrapper: document.getElementById('canvasWrapper'),
    zoomLevel: document.getElementById('zoomLevel'),
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomOut: document.getElementById('btnZoomOut'),
    btnZoomReset: document.getElementById('btnZoomReset'),
    toggleGrid: document.getElementById('toggleGrid'),
    toggleUVGuide: document.getElementById('toggleUVGuide'),
    btnUndo: document.getElementById('btnUndo'),
    btnRedo: document.getElementById('btnRedo'),
    currentTextureName: document.getElementById('currentTextureName'),
    currentTextureDim: document.getElementById('currentTextureDim'),
    canvasCoords: document.getElementById('canvasCoords'),
    primaryColor: document.getElementById('primaryColor'),
    hexInput: document.getElementById('hexInput'),
    alphaSlider: document.getElementById('alphaSlider'),
    alphaValue: document.getElementById('alphaValue'),
    brushSize: document.getElementById('brushSize'),
    toolBtns: document.querySelectorAll('.draw-tool'),
    recentColors: document.getElementById('recentColors'),
    minecraftPalette: document.getElementById('minecraftPalette'),
    imagePalette: document.getElementById('imagePalette'),
    toggleTrimOverlay: document.getElementById('toggleTrimOverlay'),
    trimSelect: document.getElementById('trimSelect'),
    btnExportPng: document.getElementById('btnExportPng'),
    btnSaveTexture: document.getElementById('btnSaveTexture'),

    // Lang Tab
    langTable: document.getElementById('langTable'),
    langTableHead: document.getElementById('langTableHead'),
    langTableBody: document.getElementById('langTableBody'),
    langSearch: document.getElementById('langSearch'),
    filterMissingOnly: document.getElementById('filterMissingOnly'),
    btnAddLangKey: document.getElementById('btnAddLangKey'),
    btnAddLangCode: document.getElementById('btnAddLangCode'),
    btnSaveLangs: document.getElementById('btnSaveLangs'),

    // Recipes Tab
    recipeList: document.getElementById('recipeList'),
    recipeSearch: document.getElementById('recipeSearch'),
    btnNewRecipe: document.getElementById('btnNewRecipe'),
    recipeIdInput: document.getElementById('recipeIdInput'),
    recipeTypeSelect: document.getElementById('recipeTypeSelect'),
    recipeCategorySelect: document.getElementById('recipeCategorySelect'),
    craftingGrid: document.getElementById('craftingGrid'),
    resultSlot: document.getElementById('resultSlot'),
    resultCountInput: document.getElementById('resultCountInput'),
    btnClearGrid: document.getElementById('btnClearGrid'),
    btnSaveCurrentRecipe: document.getElementById('btnSaveCurrentRecipe'),
    itemsPaletteContainer: document.getElementById('itemsPaletteContainer'),
    itemPaletteFilter: document.getElementById('itemPaletteFilter'),
    customItemInput: document.getElementById('customItemInput'),
    btnUseCustomItem: document.getElementById('btnUseCustomItem'),
    activeItemBadge: document.getElementById('activeItemBadge'),
    recipeJsonPreview: document.getElementById('recipeJsonPreview'),
    btnCopyRecipeJson: document.getElementById('btnCopyRecipeJson'),

    // Models Tab
    modelsList: document.getElementById('modelsList'),
    modelsSearch: document.getElementById('modelsSearch'),
    activeModelPath: document.getElementById('activeModelPath'),
    modelParentInput: document.getElementById('modelParentInput'),
    layer0Input: document.getElementById('layer0Input'),
    layer1Input: document.getElementById('layer1Input'),
    layer2Input: document.getElementById('layer2Input'),
    compositeCanvas: document.getElementById('compositeCanvas'),
    modelJsonEditor: document.getElementById('modelJsonEditor'),
    btnFormatJson: document.getElementById('btnFormatJson'),
    btnValidateJson: document.getElementById('btnValidateJson'),
    btnSaveModelJson: document.getElementById('btnSaveModelJson'),
    jsonValidationMsg: document.getElementById('jsonValidationMsg'),

    // Explorer Tab
    explorerTree: document.getElementById('explorerTree'),
    explorerActiveFile: document.getElementById('explorerActiveFile'),
    explorerPreview: document.getElementById('explorerPreview'),
    btnExplorerDelete: document.getElementById('btnExplorerDelete'),
    btnExplorerSave: document.getElementById('btnExplorerSave'),
    btnExplorerNewFile: document.getElementById('btnExplorerNewFile'),

    // Modal
    modalNewFile: document.getElementById('modalNewFile'),
    modalTitle: document.getElementById('modalTitle'),
    newFilePathInput: document.getElementById('newFilePathInput'),
    newFileTemplateSelect: document.getElementById('newFileTemplateSelect'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    btnCancelModal: document.getElementById('btnCancelModal'),
    btnConfirmCreateFile: document.getElementById('btnConfirmCreateFile')
  };

  // Canvas 2D contexts
  let pCtx = els.pixelCanvas ? els.pixelCanvas.getContext('2d', { willReadFrequently: true }) : null;
  let gCtx = els.gridCanvas ? els.gridCanvas.getContext('2d') : null;
  let oCtx = els.overlayCanvas ? els.overlayCanvas.getContext('2d') : null;
  let compCtx = els.compositeCanvas ? els.compositeCanvas.getContext('2d') : null;

  // --- Helpers ---
  function showToast(msg, type = 'success') {
    els.toast.textContent = msg;
    els.toast.className = `toast show ${type}`;
    setTimeout(() => {
      els.toast.className = 'toast';
    }, 3200);
  }

  function setUnsaved(isUnsaved = true) {
    if (isUnsaved) {
      els.saveStatus.textContent = 'Cambios sin guardar';
      els.saveStatus.className = 'save-status unsaved';
    } else {
      els.saveStatus.textContent = 'Guardado';
      els.saveStatus.className = 'save-status';
    }
  }

  async function apiGet(path) {
    const res = await fetch(path);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error de red' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function apiPost(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al enviar datos' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  function refreshIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      try {
        lucide.createIcons();
      } catch (e) {
        console.warn('Lucide icon refresh:', e);
      }
    }
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  async function init() {
    refreshIcons();
    try {
      setupEventListeners();
    } catch (err) {
      console.error('Error in setupEventListeners:', err);
    }
    try {
      renderMinecraftPalette();
      renderRecentColors();
    } catch (err) {
      console.error('Error rendering palettes:', err);
    }
    await loadMods();
    refreshIcons();
  }

  async function loadMods() {
    try {
      const data = await apiGet('/api/mods');
      state.mods = data.mods || [];
      els.modSelect.innerHTML = '';

      if (state.mods.length === 0) {
        els.modSelect.innerHTML = '<option value="">No se encontraron mods</option>';
        return;
      }

      state.mods.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.name} (${m.id})`;
        els.modSelect.appendChild(opt);
      });

      // Default to garage or first
      const defaultMod = state.mods.find(m => m.id === 'garage') || state.mods[0];
      state.currentMod = defaultMod.id;
      els.modSelect.value = state.currentMod;

      await reloadActiveMod();
    } catch (err) {
      showToast(`Error al cargar mods: ${err.message}`, 'error');
    }
  }

  async function reloadActiveMod() {
    if (!state.currentMod) return;
    setUnsaved(false);
    await Promise.all([
      loadTexturesList().catch(e => console.error('Error loadTexturesList:', e)),
      loadLangs().catch(e => console.error('Error loadLangs:', e)),
      loadRecipes().catch(e => console.error('Error loadRecipes:', e)),
      loadModelsList().catch(e => console.error('Error loadModelsList:', e)),
      loadExplorerTree().catch(e => console.error('Error loadExplorerTree:', e))
    ]);
  }

  // ==========================================
  // TAB NAVIGATION
  // ==========================================
  function switchTab(tabId) {
    state.activeTab = tabId;
    els.navTabs.forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });
    els.tabPanels.forEach((p) => {
      p.classList.toggle('active', p.id === `tab-${tabId}`);
    });
    refreshIcons();
  }

  // ==========================================
  // 1. TEXTURES & PIXEL ART STUDIO
  // ==========================================
  let textureCache = [];

  // ==========================================
  // THUMBNAIL SERVICE (SOLID - Single Responsibility)
  // Ensures every texture thumbnail is cached, high-performance & live-updated
  // ==========================================
  const ThumbnailService = {
    cache: new Map(), // path -> dataUrl
    observers: new Map(), // path -> Set<HTMLImageElement>

    async load(mod, path, imgEl) {
      if (!path) return;
      if (this.cache.has(path)) {
        if (imgEl) {
          imgEl.src = this.cache.get(path);
          imgEl.classList.add('loaded');
        }
        return this.cache.get(path);
      }

      if (imgEl) {
        if (!this.observers.has(path)) this.observers.set(path, new Set());
        this.observers.get(path).add(imgEl);
      }

      try {
        const res = await apiGet(`/api/file?mod=${encodeURIComponent(mod)}&path=${encodeURIComponent(path)}`);
        if (res && res.data) {
          this.cache.set(path, res.data);
          const obs = this.observers.get(path);
          if (obs) {
            obs.forEach(img => {
              img.src = res.data;
              img.classList.add('loaded');
            });
            this.observers.delete(path);
          }
          return res.data;
        }
      } catch (err) {
        console.warn(`[ThumbnailService] Error loading thumbnail for ${path}:`, err);
      }
      return null;
    },

    update(path, dataUrl) {
      if (!path || !dataUrl) return;
      this.cache.set(path, dataUrl);
      document.querySelectorAll(`img[data-thumb-path="${path}"]`).forEach(img => {
        img.src = dataUrl;
        img.classList.add('loaded');
      });
    }
  };

  // Texture Categories Helper
  let activeTextureCategory = 'all';

  function getTextureCategory(tex) {
    if (tex.category) return tex.category;
    const p = (tex.path || '').toLowerCase();
    if (p.includes('/entity/') || (tex.dimensions && tex.dimensions[0] >= 64)) return 'entity';
    if (p.includes('/item/')) return 'item';
    if (p.includes('/block/')) return 'block';
    if (p.endsWith('icon.png')) return 'icon';
    return 'other';
  }

  function getTextureDisplayName(tex) {
    const cat = getTextureCategory(tex);
    const stem = (tex.name || '').replace(/_/g, ' ');
    if (cat === 'entity') return `${stem} (3D UV)`;
    if (cat === 'icon') return `${stem} (Icono Mod)`;
    return stem;
  }

  async function loadTexturesList() {
    try {
      const res = await apiGet(`/api/textures-list?mod=${state.currentMod}`);
      textureCache = res.textures || [];
      renderTextureSidebar(textureCache);
      populateTrimSelect(textureCache);

      // Automatically select first texture if none active
      if (textureCache.length > 0 && !state.currentTexturePath) {
        loadTextureIntoCanvas(textureCache[0].path);
      }
    } catch (err) {
      console.error(err);
      els.textureList.innerHTML = `<div class="empty-hint">Error: ${err.message}</div>`;
    }
  }

  function renderTextureSidebar(textures) {
    const filter = (els.textureSearch ? els.textureSearch.value : '').toLowerCase().trim();

    // Calculate category counts
    const counts = { all: textures.length, item: 0, entity: 0, other: 0 };
    textures.forEach(t => {
      const c = getTextureCategory(t);
      if (c === 'item') counts.item++;
      else if (c === 'entity') counts.entity++;
      else counts.other++;
    });

    if (els.textureTotalCount) els.textureTotalCount.textContent = textures.length;
    if (els.countCatAll) els.countCatAll.textContent = counts.all;
    if (els.countCatItems) els.countCatItems.textContent = counts.item;
    if (els.countCatEntities) els.countCatEntities.textContent = counts.entity;
    if (els.countCatOthers) els.countCatOthers.textContent = counts.other;

    if (els.btnClearTextureSearch) {
      els.btnClearTextureSearch.style.display = filter ? 'block' : 'none';
    }

    const filtered = textures.filter(t => {
      const cat = getTextureCategory(t);
      if (activeTextureCategory !== 'all') {
        if (activeTextureCategory === 'item' && cat !== 'item') return false;
        if (activeTextureCategory === 'entity' && cat !== 'entity') return false;
        if (activeTextureCategory === 'other' && (cat === 'item' || cat === 'entity')) return false;
      }
      if (!filter) return true;
      return t.name.toLowerCase().includes(filter) || t.path.toLowerCase().includes(filter);
    });

    els.textureList.innerHTML = '';
    if (filtered.length === 0) {
      els.textureList.innerHTML = '<div class="empty-hint">Sin texturas que coincidan</div>';
      return;
    }

    filtered.forEach((tex) => {
      const item = document.createElement('div');
      const isActive = tex.path === state.currentTexturePath;
      item.className = `asset-item ${isActive ? 'active' : ''}`;

      const cat = getTextureCategory(tex);
      const dispName = getTextureDisplayName(tex);
      const dimStr = tex.dimensions ? `${tex.dimensions[0]}×${tex.dimensions[1]}` : (cat === 'entity' ? '256×256' : '16×16');
      const catLabel = cat === 'entity' ? '3D Entidad' : (cat === 'item' ? 'Ítem' : (cat === 'icon' ? 'Icono' : 'Textura'));

      item.innerHTML = `
        <div class="asset-item-thumb-wrapper">
          <img class="asset-item-thumb" data-thumb-path="${tex.path}" alt="${tex.name}" />
        </div>
        <div class="asset-item-info">
          <div class="asset-item-name" title="${tex.path}">${dispName}</div>
          <div class="asset-item-meta">
            <span class="badge-dim">${dimStr}</span>
            <span class="badge-cat badge-cat-${cat}">${catLabel}</span>
          </div>
        </div>
      `;

      const imgEl = item.querySelector('.asset-item-thumb');
      ThumbnailService.load(state.currentMod, tex.path, imgEl);

      item.addEventListener('click', () => {
        loadTextureIntoCanvas(tex.path);
      });
      els.textureList.appendChild(item);
    });
  }

  function populateTrimSelect(textures) {
    els.trimSelect.innerHTML = '<option value="">Seleccionar overlay...</option>';
    textures.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t.path;
      opt.textContent = t.name;
      els.trimSelect.appendChild(opt);
    });
  }

  async function loadTextureIntoCanvas(relPath) {
    try {
      state.currentTexturePath = relPath;
      renderTextureSidebar(textureCache);

      const res = await apiGet(`/api/file?mod=${state.currentMod}&path=${encodeURIComponent(relPath)}`);
      if (res.type !== 'image' || !res.data) {
        throw new Error('El archivo no es una imagen compatible');
      }

      const img = new Image();
      img.onload = () => {
        state.textureWidth = img.naturalWidth || 16;
        state.textureHeight = img.naturalHeight || 16;
        ThumbnailService.update(relPath, res.data);

        // Auto-select comfortable initial zoom based on image resolution
        if (state.textureWidth >= 128) {
          state.zoom = 3;
        } else if (state.textureWidth >= 64) {
          state.zoom = 6;
        } else {
          state.zoom = 20;
        }

        resizeCanvases(state.textureWidth, state.textureHeight);

        pCtx.clearRect(0, 0, state.textureWidth, state.textureHeight);
        pCtx.drawImage(img, 0, 0);

        state.undoStack = [pCtx.getImageData(0, 0, state.textureWidth, state.textureHeight)];
        state.redoStack = [];

        els.currentTextureName.textContent = res.name;
        els.currentTextureDim.textContent = `${state.textureWidth} x ${state.textureHeight}`;

        extractImagePalette();
        updateCanvasDisplay();
        drawGrid();

        // Scroll to top-left so painted UV islands are immediately in view
        if (els.canvasViewport) {
          els.canvasViewport.scrollLeft = 0;
          els.canvasViewport.scrollTop = 0;
        }

        if (is3DViewerOpen) {
          load3DModelForCurrentTexture();
        }
      };
      img.src = res.data;
    } catch (err) {
      showToast(`Error al cargar textura: ${err.message}`, 'error');
    }
  }

  function resizeCanvases(w, h) {
    [els.pixelCanvas, els.overlayCanvas].forEach((c) => {
      c.width = w;
      c.height = h;
    });
  }

  function updateCanvasDisplay() {
    const dispW = state.textureWidth * state.zoom;
    const dispH = state.textureHeight * state.zoom;
    els.canvasWrapper.style.width = `${dispW}px`;
    els.canvasWrapper.style.height = `${dispH}px`;
    [els.pixelCanvas, els.overlayCanvas].forEach((c) => {
      c.style.width = `${dispW}px`;
      c.style.height = `${dispH}px`;
    });
    if (els.gridCanvas) {
      els.gridCanvas.width = dispW;
      els.gridCanvas.height = dispH;
      els.gridCanvas.style.width = `${dispW}px`;
      els.gridCanvas.style.height = `${dispH}px`;
    }
    els.zoomLevel.textContent = `${state.zoom}x`;
  }

  let highlightedUVCube = null;

  function drawGrid() {
    if (!gCtx || !els.gridCanvas) return;
    const dispW = els.gridCanvas.width;
    const dispH = els.gridCanvas.height;
    gCtx.clearRect(0, 0, dispW, dispH);

    if (state.showGrid && state.zoom >= 4) {
      els.canvasWrapper.style.backgroundImage = `
        linear-gradient(to right, rgba(255, 255, 255, 0.09) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.09) 1px, transparent 1px)
      `;
      els.canvasWrapper.style.backgroundSize = `${state.zoom}px ${state.zoom}px`;
    } else {
      els.canvasWrapper.style.backgroundImage = 'none';
    }

    // Draw UV Guide Boxes for 3D Entity Models if enabled
    const showUV = els.toggleUVGuide ? els.toggleUVGuide.checked : false;
    if ((showUV || highlightedUVCube) && currentLoaded3DModel && state.textureWidth >= 64) {
      const z = state.zoom;
      const drawLayerUVs = (parts, strokeColor, fillColor) => {
        (parts || []).forEach((p) => {
          (p.cubes || []).forEach((c) => {
            const [bx, by, bz, rawDx, rawDy, rawDz] = c.box;
            const dx = Math.floor(rawDx);
            const dy = Math.floor(rawDy);
            const dz = Math.floor(rawDz);
            const u = c.u;
            const v = c.v;
            const totalW = Math.max(2 * dz + 2 * dx, 1);
            const totalH = Math.max(dz + dy, 1);

            const isHighlighted =
              highlightedUVCube &&
              highlightedUVCube.u === u &&
              highlightedUVCube.v === v &&
              highlightedUVCube.partName === (p.id || p.name);

            if (showUV) {
              gCtx.strokeStyle = isHighlighted ? '#fbbf24' : strokeColor;
              gCtx.lineWidth = isHighlighted ? 2.5 : 1;
              gCtx.strokeRect(u * z + 0.5, v * z + 0.5, totalW * z - 1, totalH * z - 1);
              if (isHighlighted) {
                gCtx.fillStyle = 'rgba(251, 191, 36, 0.18)';
                gCtx.fillRect(u * z, v * z, totalW * z, totalH * z);
              }
            } else if (isHighlighted) {
              gCtx.strokeStyle = '#fbbf24';
              gCtx.lineWidth = 2.5;
              gCtx.strokeRect(u * z + 0.5, v * z + 0.5, totalW * z - 1, totalH * z - 1);
              gCtx.fillStyle = 'rgba(251, 191, 36, 0.18)';
              gCtx.fillRect(u * z, v * z, totalW * z, totalH * z);
            }
          });
        });
      };

      if (currentLoaded3DModel.layers) {
        drawLayerUVs(currentLoaded3DModel.layers.body, 'rgba(59, 130, 246, 0.55)');
        drawLayerUVs(currentLoaded3DModel.layers.trim, 'rgba(34, 197, 94, 0.50)');
      }
    }
  }

  function getPixelCoords(evt) {
    const rect = els.pixelCanvas.getBoundingClientRect();
    const scaleX = state.textureWidth / rect.width;
    const scaleY = state.textureHeight / rect.height;
    const x = Math.floor((evt.clientX - rect.left) * scaleX);
    const y = Math.floor((evt.clientY - rect.top) * scaleY);
    return { x: Math.max(0, Math.min(state.textureWidth - 1, x)), y: Math.max(0, Math.min(state.textureHeight - 1, y)) };
  }

  function pushUndo() {
    state.undoStack.push(pCtx.getImageData(0, 0, state.textureWidth, state.textureHeight));
    if (state.undoStack.length > state.maxUndo) state.undoStack.shift();
    state.redoStack = [];
    setUnsaved(true);
  }

  function undo() {
    if (state.undoStack.length <= 1) return;
    const current = state.undoStack.pop();
    state.redoStack.push(current);
    const prev = state.undoStack[state.undoStack.length - 1];
    pCtx.putImageData(prev, 0, 0);
    extractImagePalette();
    notify3DTextureUpdated();
  }

  function redo() {
    if (state.redoStack.length === 0) return;
    const next = state.redoStack.pop();
    state.undoStack.push(next);
    pCtx.putImageData(next, 0, 0);
    extractImagePalette();
    notify3DTextureUpdated();
  }

  // ==========================================
  // DRAWING TOOLS STRATEGY (SOLID: OCP & LSP)
  // Clean, extensible strategy pattern eliminating switch-cases and duplicated code
  // ==========================================
  class BaseTool {
    constructor(id, name, cursor = 'crosshair') {
      this.id = id;
      this.name = name;
      this.cursor = cursor;
    }
    isWholeCanvas() { return false; }
    applyPixel(ctx, x, y, state) {}
    execute(x, y, state) {}
  }

  class PenTool extends BaseTool {
    constructor() { super('pen', 'Lápiz', 'crosshair'); }
    applyPixel(ctx, x, y, state) {
      drawSinglePixel(x, y, state.primaryColor, state.primaryAlpha);
    }
  }

  class EraserTool extends BaseTool {
    constructor() { super('eraser', 'Borrador', 'crosshair'); }
    applyPixel(ctx, x, y) {
      pCtx.clearRect(x, y, 1, 1);
    }
  }

  class LightenTool extends BaseTool {
    constructor() { super('lighten', 'Aclarar', 'crosshair'); }
    applyPixel(ctx, x, y) {
      adjustPixelLuminance(x, y, 25);
    }
  }

  class DarkenTool extends BaseTool {
    constructor() { super('darken', 'Oscurecer', 'crosshair'); }
    applyPixel(ctx, x, y) {
      adjustPixelLuminance(x, y, -25);
    }
  }

  class PickerTool extends BaseTool {
    constructor() { super('picker', 'Gotero', 'crosshair'); }
    isWholeCanvas() { return true; }
    execute(x, y) {
      const p = pCtx.getImageData(x, y, 1, 1).data;
      if (p[3] > 0) {
        setPrimaryColor(rgbToHex(p[0], p[1], p[2]), p[3]);
      }
    }
  }

  class BucketTool extends BaseTool {
    constructor() { super('bucket', 'Bote de Pintura', 'crosshair'); }
    isWholeCanvas() { return true; }
    execute(x, y, state) {
      floodFill(x, y, state.primaryColor, state.primaryAlpha);
    }
  }

  class PanTool extends BaseTool {
    constructor() { super('pan', 'Mover Lienzo', 'grab'); }
    isWholeCanvas() { return true; }
    execute() {}
  }

  const ToolRegistry = new Map([
    ['pen', new PenTool()],
    ['eraser', new EraserTool()],
    ['picker', new PickerTool()],
    ['bucket', new BucketTool()],
    ['lighten', new LightenTool()],
    ['darken', new DarkenTool()],
    ['pan', new PanTool()]
  ]);

  function applyPixelTool(x, y) {
    const tool = ToolRegistry.get(state.tool) || ToolRegistry.get('pen');
    if (!tool || tool.id === 'pan') return;

    if (tool.isWholeCanvas()) {
      tool.execute(x, y, state);
      notify3DTextureUpdated();
      if (state.currentTexturePath) {
        ThumbnailService.update(state.currentTexturePath, els.pixelCanvas.toDataURL('image/png'));
      }
      return;
    }

    const size = parseInt(state.brushSize, 10);
    const half = Math.floor(size / 2);

    for (let dx = 0; dx < size; dx++) {
      for (let dy = 0; dy < size; dy++) {
        const px = x - half + dx;
        const py = y - half + dy;
        if (px < 0 || px >= state.textureWidth || py < 0 || py >= state.textureHeight) continue;
        tool.applyPixel(pCtx, px, py, state);
      }
    }

    notify3DTextureUpdated();
    if (state.currentTexturePath) {
      ThumbnailService.update(state.currentTexturePath, els.pixelCanvas.toDataURL('image/png'));
    }
  }

  function drawSinglePixel(x, y, hex, alpha) {
    const rgba = hexToRgba(hex, alpha);
    pCtx.fillStyle = rgba;
    // Clear first to avoid blending with transparent colors if replacing
    pCtx.clearRect(x, y, 1, 1);
    pCtx.fillRect(x, y, 1, 1);
  }

  function adjustPixelLuminance(x, y, delta) {
    const imgData = pCtx.getImageData(x, y, 1, 1);
    const d = imgData.data;
    if (d[3] === 0) return; // don't shade empty pixels
    d[0] = Math.max(0, Math.min(255, d[0] + delta));
    d[1] = Math.max(0, Math.min(255, d[1] + delta));
    d[2] = Math.max(0, Math.min(255, d[2] + delta));
    pCtx.putImageData(imgData, x, y);
  }

  function floodFill(startX, startY, fillHex, fillAlpha) {
    const imgData = pCtx.getImageData(0, 0, state.textureWidth, state.textureHeight);
    const data = imgData.data;
    const targetIdx = (startY * state.textureWidth + startX) * 4;
    const targetR = data[targetIdx];
    const targetG = data[targetIdx + 1];
    const targetB = data[targetIdx + 2];
    const targetA = data[targetIdx + 3];

    const rgb = hexToRgb(fillHex);
    const fillR = rgb.r;
    const fillG = rgb.g;
    const fillB = rgb.b;
    const fillA = fillAlpha;

    if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) return;

    const queue = [[startX, startY]];
    const seen = new Uint8Array(state.textureWidth * state.textureHeight);

    function match(idx) {
      return (
        data[idx] === targetR &&
        data[idx + 1] === targetG &&
        data[idx + 2] === targetB &&
        data[idx + 3] === targetA
      );
    }

    while (queue.length > 0) {
      const [cx, cy] = queue.pop();
      const pos = cy * state.textureWidth + cx;
      if (seen[pos]) continue;
      seen[pos] = 1;

      const idx = pos * 4;
      if (match(idx)) {
        data[idx] = fillR;
        data[idx + 1] = fillG;
        data[idx + 2] = fillB;
        data[idx + 3] = fillA;

        if (cx > 0) queue.push([cx - 1, cy]);
        if (cx < state.textureWidth - 1) queue.push([cx + 1, cy]);
        if (cy > 0) queue.push([cx, cy - 1]);
        if (cy < state.textureHeight - 1) queue.push([cx, cy + 1]);
      }
    }

    pCtx.putImageData(imgData, 0, 0);
  }

  function setActiveTool(toolName) {
    const valid = ['pen', 'eraser', 'picker', 'bucket', 'lighten', 'darken', 'pan'];
    state.tool = valid.includes(toolName) ? toolName : 'pen';
    if (els.toolBtns) {
      els.toolBtns.forEach((b) => {
        b.classList.toggle('active', b.dataset.tool === state.tool);
      });
    }
    if (els.canvasViewport) {
      if (state.tool === 'pan') {
        els.canvasViewport.style.cursor = 'grab';
      } else if (state.tool === 'picker') {
        els.canvasViewport.style.cursor = 'crosshair';
      } else {
        els.canvasViewport.style.cursor = 'crosshair';
      }
    }
  }

  function setPrimaryColor(hex, alpha = 255) {
    state.primaryColor = hex.toUpperCase();
    state.primaryAlpha = alpha;
    els.primaryColor.value = hex;
    els.hexInput.value = hex.toUpperCase();
    els.alphaSlider.value = alpha;
    els.alphaValue.textContent = `${Math.round((alpha / 255) * 100)}%`;
    addRecentColor(hex);
  }

  function addRecentColor(hex) {
    if (!state.recentColors.includes(hex)) {
      state.recentColors.unshift(hex);
      if (state.recentColors.length > 18) state.recentColors.pop();
      renderRecentColors();
    }
  }

  function renderRecentColors() {
    els.recentColors.innerHTML = '';
    state.recentColors.forEach((hex) => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = hex;
      swatch.title = hex;
      swatch.addEventListener('click', () => setPrimaryColor(hex));
      els.recentColors.appendChild(swatch);
    });
  }

  function renderMinecraftPalette() {
    els.minecraftPalette.innerHTML = '';
    MINECRAFT_PALETTE.forEach((hex) => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = hex;
      swatch.title = hex;
      swatch.addEventListener('click', () => setPrimaryColor(hex));
      els.minecraftPalette.appendChild(swatch);
    });
  }

  function extractImagePalette() {
    const imgData = pCtx.getImageData(0, 0, state.textureWidth, state.textureHeight).data;
    const colors = new Set();
    for (let i = 0; i < imgData.length; i += 4) {
      if (imgData[i + 3] > 30) {
        const hex = rgbToHex(imgData[i], imgData[i + 1], imgData[i + 2]);
        colors.add(hex);
        if (colors.size >= 18) break;
      }
    }
    els.imagePalette.innerHTML = '';
    colors.forEach((hex) => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = hex;
      swatch.title = hex;
      swatch.addEventListener('click', () => setPrimaryColor(hex));
      els.imagePalette.appendChild(swatch);
    });
  }

  async function saveActiveTexture() {
    if (!state.currentTexturePath) {
      showToast('No hay textura seleccionada', 'error');
      return;
    }
    try {
      const dataUrl = els.pixelCanvas.toDataURL('image/png');
      await apiPost('/api/save', {
        mod: state.currentMod,
        path: state.currentTexturePath,
        type: 'image',
        content: dataUrl
      });
      setUnsaved(false);
      ThumbnailService.update(state.currentTexturePath, dataUrl);
      showToast(`Textura guardada: ${state.currentTexturePath}`, 'success');
      loadTexturesList();
    } catch (err) {
      showToast(`Error al guardar: ${err.message}`, 'error');
    }
  }

  function downloadTexturePng() {
    if (!els.pixelCanvas) return;
    const link = document.createElement('a');
    const name = state.currentTexturePath.split('/').pop() || 'texture.png';
    link.download = name;
    link.href = els.pixelCanvas.toDataURL('image/png');
    link.click();
  }

  // ==========================================
  // 1.5 3D MINECRAFT MODEL VIEWER (THREE.JS ADVANCED)
  // ==========================================
  let threeScene = null;
  let threeCamera = null;
  let threeRenderer = null;
  let threeControls = null;
  let threeTexture = null;
  let threeModelGroup = null;
  let threeBodyGroup = null;
  let threeTrimGroup = null;
  let threeScaleBlock = null;
  let threeRaycaster = null;
  let threeMouse = null;
  let threeAnimFrame = null;
  let is3DViewerOpen = false;
  let currentLoaded3DModel = null;
  let mode3D = 'orbit'; // 'orbit', 'pick_uv', 'paint'
  let partMeshList = []; // Array of { mesh, partId, partName, cubes }

  function notify3DTextureUpdated() {
    if (threeTexture && is3DViewerOpen) {
      threeTexture.needsUpdate = true;
    }
  }

  function toggle3DViewer(forceOpen = null) {
    if (forceOpen !== null) {
      is3DViewerOpen = forceOpen;
    } else {
      is3DViewerOpen = !is3DViewerOpen;
    }

    els.panel3DViewport.style.display = is3DViewerOpen ? 'flex' : 'none';
    els.btnToggle3D.classList.toggle('active', is3DViewerOpen);
    refreshIcons();

    if (is3DViewerOpen) {
      if (!threeRenderer) {
        init3DViewer();
      } else {
        setTimeout(onWindowResize3D, 50);
      }
      load3DModelForCurrentTexture();
    }
  }

  function init3DViewer() {
    if (typeof THREE === 'undefined') {
      showToast('Cargando librería 3D Three.js...', 'info');
      return;
    }

    const container = els.container3DCanvas;
    const w = container.clientWidth || 500;
    const h = container.clientHeight || 500;

    // Scene
    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0x13151b);

    // Camera (adjusted near/far for optimal depth precision)
    threeCamera = new THREE.PerspectiveCamera(40, w / h, 0.5, 500);
    reset3DCamera();

    // WebGL Renderer with pixelated canvas texture support and logarithmic depth buffer
    threeRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      logarithmicDepthBuffer: true
    });
    threeRenderer.setSize(w, h);
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeRenderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(threeRenderer.domElement);

    // Orbit Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
      threeControls.enableDamping = true;
      threeControls.dampingFactor = 0.07;
      threeControls.target.set(0, 10, 0);
      threeControls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };
    }

    // Raycasting for interactive 3D picking & painting
    threeRaycaster = new THREE.Raycaster();
    threeMouse = new THREE.Vector2();

    // Studio Lights (Minecraft sun angle + soft rim lights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.80);
    threeScene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.90);
    sunLight.position.set(30, 50, 25);
    sunLight.castShadow = true;
    threeScene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xa0c0ff, 0.40);
    fillLight.position.set(-25, 20, -25);
    threeScene.add(fillLight);

    const bottomLight = new THREE.DirectionalLight(0x202535, 0.35);
    bottomLight.position.set(0, -20, 0);
    threeScene.add(bottomLight);

    // Minecraft Ground Grid Helper
    const gridHelper = new THREE.GridHelper(64, 32, 0x4a5568, 0x222634);
    gridHelper.position.y = 0;
    threeScene.add(gridHelper);

    // Reference 1m x 1m x 1m Minecraft Block (16x16x16 units)
    const blockGeom = new THREE.BoxGeometry(16, 16, 16);
    const blockMat = new THREE.MeshStandardMaterial({
      color: 0x4a7c59,
      roughness: 0.9,
      wireframe: false
    });
    threeScaleBlock = new THREE.Mesh(blockGeom, blockMat);
    threeScaleBlock.position.set(24, 8, 0);
    threeScaleBlock.visible = false;
    threeScene.add(threeScaleBlock);

    // Texture bound to 2D pixelCanvas
    threeTexture = new THREE.CanvasTexture(els.pixelCanvas);
    threeTexture.magFilter = THREE.NearestFilter;
    threeTexture.minFilter = THREE.NearestFilter;
    threeTexture.generateMipmaps = false;

    // Model root group
    threeModelGroup = new THREE.Group();
    threeScene.add(threeModelGroup);

    // Animation Render Loop
    let lastTime = performance.now();
    function animate(now) {
      threeAnimFrame = requestAnimationFrame(animate);
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (threeControls && mode3D === 'orbit') {
        threeControls.update();
      }

      // Auto-rotation
      if (els.check3DAutoRotate && els.check3DAutoRotate.checked && threeModelGroup) {
        threeModelGroup.rotation.y += 0.008;
      }

      // Continuous wheel roll animation
      if (els.check3DSpinWheels && els.check3DSpinWheels.checked && threeTrimGroup) {
        const spinSpeed = 4.0 * delta;
        threeTrimGroup.traverse((child) => {
          if (child.name && (child.name.includes('wheel') || child.name.includes('front_wheel') || child.name.includes('rear_wheel'))) {
            child.rotation.x += spinSpeed;
          }
        });
      }

      threeRenderer.render(threeScene, threeCamera);
    }
    animate(performance.now());

    // Window and Container Resize
    window.addEventListener('resize', onWindowResize3D);

    // Setup 3D Canvas Interactivity (Raycasting, hover part, paint, etc.)
    setup3DCanvasEvents();
  }

  function reset3DCamera() {
    if (!threeCamera) return;
    set3DCameraPreset('iso');
  }

  function set3DCameraPreset(viewName) {
    if (!threeCamera) return;
    const dist = 55;
    const centerY = 9;

    switch (viewName) {
      case 'iso':
        threeCamera.position.set(38, 26, 42);
        break;
      case 'front': // Looking towards +Z (facing front of vehicle at -Z)
        threeCamera.position.set(0, centerY, -dist);
        break;
      case 'back': // Looking towards -Z
        threeCamera.position.set(0, centerY, dist);
        break;
      case 'left': // From +X side
        threeCamera.position.set(dist, centerY, 0);
        break;
      case 'right': // From -X side
        threeCamera.position.set(-dist, centerY, 0);
        break;
      case 'top': // Overhead
        threeCamera.position.set(0, dist + 10, 0.01);
        break;
    }

    threeCamera.lookAt(0, centerY, 0);
    if (threeControls) {
      threeControls.target.set(0, centerY, 0);
      threeControls.update();
    }
  }

  function onWindowResize3D() {
    if (!threeRenderer || !els.container3DCanvas || !threeCamera) return;
    const w = els.container3DCanvas.clientWidth;
    const h = els.container3DCanvas.clientHeight;
    if (w > 0 && h > 0) {
      threeCamera.aspect = w / h;
      threeCamera.updateProjectionMatrix();
      threeRenderer.setSize(w, h);
    }
  }

  async function load3DModelForCurrentTexture() {
    if (!is3DViewerOpen || !threeScene) return;

    // Detect model override or deduce from active texture path
    const override = els.select3DModelOverride ? els.select3DModelOverride.value : 'auto';
    let modelName = 'motorcycle';

    if (override !== 'auto') {
      modelName = override;
    } else {
      const path = state.currentTexturePath.toLowerCase();
      if (path.includes('motorcycle')) modelName = 'motorcycle';
      else if (path.includes('motocarro')) modelName = 'motocarro';
      else if (path.includes('car')) modelName = 'car';
      else if (path.includes('item')) modelName = 'item';
    }

    if (els.select3DModelOverride && override === 'auto') {
      els.select3DModelOverride.value = 'auto';
    }

    // Check built-in models first for instantaneous zero-latency loading
    if (window.BUILTIN_3D_MODELS && window.BUILTIN_3D_MODELS[modelName]) {
      currentLoaded3DModel = window.BUILTIN_3D_MODELS[modelName];
      build3DVehicleScene(currentLoaded3DModel);
      drawGrid();
      return;
    }

    try {
      const res = await apiGet(`/api/model-3d?mod=${state.currentMod}&name=${modelName}`);
      if (res.model && res.model.layers) {
        currentLoaded3DModel = res.model;
        build3DVehicleScene(res.model);
        drawGrid();
      }
    } catch (err) {
      console.error('Error al cargar modelo 3D:', err);
    }
  }

  function build3DVehicleScene(modelData) {
    if (!threeModelGroup) return;

    // Clear old meshes
    while (threeModelGroup.children.length > 0) {
      const obj = threeModelGroup.children[0];
      threeModelGroup.remove(obj);
    }
    partMeshList = [];

    const texW = modelData.textureWidth || 256;
    const texH = modelData.textureHeight || 256;

    // Ensure threeTexture exists and has the current canvas
    if (!threeTexture) {
      threeTexture = new THREE.CanvasTexture(els.pixelCanvas);
      threeTexture.magFilter = THREE.NearestFilter;
      threeTexture.minFilter = THREE.NearestFilter;
      threeTexture.generateMipmaps = false;
    }
    threeTexture.needsUpdate = true;

    // Body Material (dye tinted)
    const tintColor = els.color3DVehicleTint ? els.color3DVehicleTint.value : (modelData.defaultTint || '#1846C7');
    if (els.color3DVehicleTint && !els.color3DVehicleTint.dataset.userChanged) {
      els.color3DVehicleTint.value = tintColor;
    }

    const wireframe = els.check3DWireframe ? els.check3DWireframe.checked : false;
    const alphaCutout = els.check3DAlphaCutout ? els.check3DAlphaCutout.checked : true;

    const bodyMaterial = new THREE.MeshStandardMaterial({
      map: threeTexture,
      color: new THREE.Color(tintColor),
      roughness: 0.65,
      metalness: 0.15,
      side: THREE.FrontSide,
      wireframe: wireframe,
      transparent: false,
      alphaTest: alphaCutout ? 0.1 : 0.0,
      depthWrite: true,
      depthTest: true
    });

    const trimMaterial = new THREE.MeshStandardMaterial({
      map: threeTexture,
      color: 0xffffff,
      roughness: 0.55,
      metalness: 0.25,
      side: THREE.FrontSide,
      wireframe: wireframe,
      transparent: false,
      alphaTest: alphaCutout ? 0.1 : 0.0,
      depthWrite: true,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0
    });

    threeBodyGroup = new THREE.Group();
    threeTrimGroup = new THREE.Group();

    // Build Body Layer
    const bodyParts = modelData.layers.body || [];
    buildPartsHierarchy(bodyParts, threeBodyGroup, bodyMaterial, texW, texH);

    // Build Trim Layer
    const trimParts = modelData.layers.trim || [];
    buildPartsHierarchy(trimParts, threeTrimGroup, trimMaterial, texW, texH);

    threeModelGroup.add(threeBodyGroup);
    threeModelGroup.add(threeTrimGroup);

    apply3DLayerVisibility();
    apply3DKinematics();
    notify3DTextureUpdated();
  }

  function buildPartsHierarchy(parts, rootGroup, material, texW, texH) {
    const groupMap = { root: rootGroup };

    parts.forEach((p) => {
      const partGroup = new THREE.Group();
      const pId = p.id || p.name;
      partGroup.name = pId;

      const px = p.pos[0];
      const py = p.pos[1];
      const pz = p.pos[2];

      // In Minecraft, root level ground is at y = 24.
      // Top-level children of root are offset by -(py - 24), nested children by -py
      const isTopLevel = p.parent === 'root';
      partGroup.position.set(px, isTopLevel ? -(py - 24) : -py, pz);

      // Rotation (radians)
      partGroup.rotation.set(-p.rot[0], -p.rot[1], p.rot[2]);

      // Cubes
      (p.cubes || []).forEach((c, cIdx) => {
        let [x, y, z, dx, dy, dz] = c.box;
        const isPlane = dx <= 0 || dy <= 0 || dz <= 0;
        if (dx <= 0) dx = 0.08;
        if (dy <= 0) dy = 0.08;
        if (dz <= 0) dz = 0.08;

        const geom = createMinecraftBoxGeometry(dx, dy, dz, c.u, c.v, texW, texH);
        let meshMat = material;
        if (isPlane) {
          meshMat = material.clone();
          meshMat.side = THREE.DoubleSide;
        }
        const mesh = new THREE.Mesh(geom, meshMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Position box relative to part pivot
        mesh.position.set(x + dx / 2, -(y + dy / 2), z + dz / 2);
        mesh.userData = {
          partId: pId,
          partName: p.name || pId,
          cube: c,
          cubeIndex: cIdx
        };

        partGroup.add(mesh);
        partMeshList.push(mesh);
      });

      groupMap[pId] = partGroup;
      if (p.name) groupMap[p.name] = partGroup;

      const parentGroup = groupMap[p.parent] || rootGroup;
      parentGroup.add(partGroup);
    });
  }

  function createMinecraftBoxGeometry(dx, dy, dz, u, v, texW, texH) {
    const geom = new THREE.BoxGeometry(dx, dy, dz);
    const uvAttr = geom.attributes.uv;
    const uvs = uvAttr.array;

    function setFaceUV(faceIdx, u1, v1, u2, v2) {
      const U1 = u1 / texW;
      const U2 = u2 / texW;
      const V1 = 1.0 - (v2 / texH);
      const V2 = 1.0 - (v1 / texH);

      const offset = faceIdx * 8;
      uvs[offset + 0] = U1; uvs[offset + 1] = V2;
      uvs[offset + 2] = U2; uvs[offset + 3] = V2;
      uvs[offset + 4] = U1; uvs[offset + 5] = V1;
      uvs[offset + 6] = U2; uvs[offset + 7] = V1;
    }

    // Minecraft UV Box unwrapping:
    // West (+X)
    setFaceUV(0, u, v + dz, u + dz, v + dz + dy);
    // East (-X)
    setFaceUV(1, u + dz + dx, v + dz, u + dz + dx + dz, v + dz + dy);
    // Top (+Y)
    setFaceUV(2, u + dz, v, u + dz + dx, v + dz);
    // Bottom (-Y)
    setFaceUV(3, u + dz + dx, v, u + dz + dx + dx, v + dz);
    // South / Back (+Z)
    setFaceUV(4, u + dz + dx + dz, v + dz, u + 2 * dz + 2 * dx, v + dz + dy);
    // North / Front (-Z)
    setFaceUV(5, u + dz, v + dz, u + dz + dx, v + dz + dy);

    uvAttr.needsUpdate = true;
    return geom;
  }

  function apply3DLayerVisibility() {
    const val = els.select3DLayers ? els.select3DLayers.value : 'both';
    if (threeBodyGroup) threeBodyGroup.visible = val === 'both' || val === 'body';
    if (threeTrimGroup) threeTrimGroup.visible = val === 'both' || val === 'trim';
  }

  function apply3DKinematics() {
    if (!threeModelGroup) return;

    const steerDeg = parseFloat(els.slider3DSteer ? els.slider3DSteer.value : 0);
    const leanDeg = parseFloat(els.slider3DLean ? els.slider3DLean.value : 0);

    const steerRad = (steerDeg * Math.PI) / 180;
    const leanRad = (leanDeg * Math.PI) / 180;

    let hasLeanRoot = false;
    threeModelGroup.traverse((obj) => {
      if (obj.name === 'lean_root') {
        obj.rotation.z = leanRad;
        hasLeanRoot = true;
      }
      if (obj.name === 'steering') {
        obj.rotation.y = steerRad;
      }
      if (obj.name === 'wheel_fl' || obj.name === 'wheel_fr') {
        obj.rotation.y = steerRad;
      }
    });

    if (!hasLeanRoot) {
      threeModelGroup.rotation.z = leanRad;
    }
  }

  function update3DMaterials() {
    const wireframe = els.check3DWireframe ? els.check3DWireframe.checked : false;
    const alphaCutout = els.check3DAlphaCutout ? els.check3DAlphaCutout.checked : true;

    if (threeModelGroup) {
      threeModelGroup.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.wireframe = wireframe;
          child.material.transparent = false;
          child.material.alphaTest = alphaCutout ? 0.1 : 0.0;
          child.material.depthWrite = true;
          child.material.depthTest = true;
          child.material.needsUpdate = true;
        }
      });
    }
  }

  function setup3DCanvasEvents() {
    const container = els.container3DCanvas;
    if (!container) return;

    // Hover tooltip for parts & 3D raycast interaction
    container.addEventListener('mousemove', (e) => {
      if (!threeRaycaster || !threeCamera || partMeshList.length === 0) return;

      const rect = container.getBoundingClientRect();
      threeMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      threeMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      threeRaycaster.setFromCamera(threeMouse, threeCamera);
      const intersects = threeRaycaster.intersectObjects(partMeshList, false);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const data = hit.object.userData;
        const partName = data.partName || data.partId || 'Pieza';
        if (els.hover3DPartBadge) {
          els.hover3DPartBadge.textContent = `🎯 ${partName.replace(/_/g, ' ')}`;
          els.hover3DPartBadge.style.color = '#fbbf24';
        }

        if (mode3D === 'paint' && e.buttons === 1) {
          paintPixelFromRaycast(hit);
        }
      } else {
        if (els.hover3DPartBadge) {
          els.hover3DPartBadge.textContent = mode3D === 'pick_uv'
            ? '🎯 Clic en cualquier parte para enfocar UV en el lienzo'
            : (mode3D === 'paint' ? '🖌️ Clic en el modelo 3D para pintar' : 'Modo Orbitar');
          els.hover3DPartBadge.style.color = '#93c5fd';
        }
      }
    });

    container.addEventListener('click', (e) => {
      if (!threeRaycaster || !threeCamera || partMeshList.length === 0) return;

      const rect = container.getBoundingClientRect();
      threeMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      threeMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      threeRaycaster.setFromCamera(threeMouse, threeCamera);
      const intersects = threeRaycaster.intersectObjects(partMeshList, false);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const data = hit.object.userData;

        if (mode3D === 'pick_uv') {
          focusUVOn2DCanvas(data);
        } else if (mode3D === 'paint') {
          paintPixelFromRaycast(hit);
        }
      }
    });
  }

  function focusUVOn2DCanvas(userData) {
    if (!userData || !userData.cube) return;
    const c = userData.cube;
    const u = c.u;
    const v = c.v;
    const partName = userData.partName || userData.partId;

    highlightedUVCube = { u, v, partName };
    drawGrid();

    // Scroll 2D canvas viewport to center on this UV region
    if (els.canvasViewport) {
      const z = state.zoom;
      const targetX = u * z - els.canvasViewport.clientWidth / 2;
      const targetY = v * z - els.canvasViewport.clientHeight / 2;
      els.canvasViewport.scrollTo({
        left: Math.max(0, targetX),
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });
    }

    showToast(`Enfocado en lienzo 2D: ${partName.replace(/_/g, ' ')} (U:${u}, V:${v})`, 'success');
  }

  function paintPixelFromRaycast(hit) {
    if (!hit || !hit.uv) return;
    const uv = hit.uv;
    const px = Math.floor(uv.x * state.textureWidth);
    const py = Math.floor((1.0 - uv.y) * state.textureHeight);

    if (px >= 0 && px < state.textureWidth && py >= 0 && py < state.textureHeight) {
      pushUndo();
      if (state.tool === 'picker') {
        const p = pCtx.getImageData(px, py, 1, 1).data;
        if (p[3] > 0) {
          const hex = rgbToHex(p[0], p[1], p[2]);
          setPrimaryColor(hex, p[3]);
        }
      } else {
        applyPixelTool(px, py);
      }
    }
  }

  function take3DSnapshot() {
    if (!threeRenderer || !threeScene || !threeCamera) return;
    threeRenderer.render(threeScene, threeCamera);
    const dataUrl = threeRenderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${state.currentMod}_model_3d.png`;
    link.href = dataUrl;
    link.click();
    showToast('Captura 3D guardada como PNG', 'success');
  }

  // ==========================================
  // 2. LANG / LOCALIZATION STUDIO
  // ==========================================
  async function loadLangs() {
    try {
      const res = await apiGet(`/api/langs?mod=${state.currentMod}`);
      state.langData = res.data || {};
      state.langLanguages = res.languages || [];
      state.langKeys = res.keys || [];
      state.langFiles = res.files || {};
      renderLangTable();
    } catch (err) {
      console.error(err);
      els.langTableBody.innerHTML = `<tr><td colspan="4" class="empty-hint">Error al cargar idiomas: ${err.message}</td></tr>`;
    }
  }

  function renderLangTable() {
    const filter = (els.langSearch.value || '').toLowerCase().trim();
    const onlyMissing = els.filterMissingOnly.checked;

    // Build Table Header
    els.langTableHead.innerHTML = `
      <tr>
        <th style="width: 280px;">Clave (Key)</th>
        ${state.langLanguages.map(lang => `<th><code>${lang}.json</code></th>`).join('')}
        <th style="width: 50px;"></th>
      </tr>
    `;

    // Filter Keys
    const filteredKeys = state.langKeys.filter((key) => {
      let matchesFilter = !filter || key.toLowerCase().includes(filter);
      let isMissing = false;

      for (const lang of state.langLanguages) {
        const val = state.langData[lang]?.[key];
        if (!val || val.trim() === '') {
          isMissing = true;
        }
        if (filter && val && val.toLowerCase().includes(filter)) {
          matchesFilter = true;
        }
      }

      if (onlyMissing && !isMissing) return false;
      return matchesFilter;
    });

    els.langTableBody.innerHTML = '';
    if (filteredKeys.length === 0) {
      els.langTableBody.innerHTML = `<tr><td colspan="${state.langLanguages.length + 2}" class="empty-hint">Sin claves encontradas</td></tr>`;
      return;
    }

    filteredKeys.forEach((key) => {
      const row = document.createElement('tr');
      let rowHtml = `<td class="lang-key-cell" title="${key}">${key}</td>`;

      state.langLanguages.forEach((lang) => {
        const val = state.langData[lang]?.[key] ?? '';
        const isMissing = !val || val.trim() === '';
        rowHtml += `
          <td>
            <input type="text" class="lang-input-cell ${isMissing ? 'missing' : ''}" 
                   data-lang="${lang}" data-key="${key}" value="${escapeHtml(val)}" 
                   placeholder="${isMissing ? '(Falta traducción)' : ''}" />
          </td>
        `;
      });

      rowHtml += `
        <td>
          <button class="btn-icon btn-del-key" data-key="${key}" title="Eliminar clave">🗑️</button>
        </td>
      `;

      row.innerHTML = rowHtml;
      els.langTableBody.appendChild(row);
    });

    // Attach row input listeners
    els.langTableBody.querySelectorAll('.lang-input-cell').forEach((input) => {
      input.addEventListener('input', (e) => {
        const lang = e.target.dataset.lang;
        const key = e.target.dataset.key;
        if (!state.langData[lang]) state.langData[lang] = {};
        state.langData[lang][key] = e.target.value;
        e.target.classList.toggle('missing', !e.target.value.trim());
        setUnsaved(true);
      });
    });

    els.langTableBody.querySelectorAll('.btn-del-key').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const key = e.target.dataset.key;
        if (confirm(`¿Eliminar la clave "${key}" de todos los idiomas?`)) {
          state.langLanguages.forEach((lang) => {
            if (state.langData[lang]) delete state.langData[lang][key];
          });
          state.langKeys = state.langKeys.filter(k => k !== key);
          renderLangTable();
          setUnsaved(true);
        }
      });
    });
  }

  async function saveLangs() {
    try {
      await apiPost('/api/save-langs', {
        mod: state.currentMod,
        langData: state.langData,
        files: state.langFiles
      });
      setUnsaved(false);
      showToast('Idiomas guardados correctamente', 'success');
    } catch (err) {
      showToast(`Error al guardar idiomas: ${err.message}`, 'error');
    }
  }

  function addNewLangKey() {
    const key = prompt('Introduce la nueva clave de traducción (ej: item.garage.turbo):');
    if (!key || !key.trim()) return;
    const cleanKey = key.trim();
    if (state.langKeys.includes(cleanKey)) {
      showToast('Esta clave ya existe', 'error');
      return;
    }
    state.langKeys.push(cleanKey);
    state.langKeys.sort();
    state.langLanguages.forEach((l) => {
      if (!state.langData[l]) state.langData[l] = {};
      state.langData[l][cleanKey] = '';
    });
    renderLangTable();
    setUnsaved(true);
  }

  function addNewLanguageCode() {
    const code = prompt('Introduce el código de idioma Minecraft (ej: fr_fr, de_de, pt_br):');
    if (!code || !code.trim()) return;
    const cleanCode = code.trim().toLowerCase();
    if (state.langLanguages.includes(cleanCode)) {
      showToast('Este idioma ya está cargado', 'error');
      return;
    }
    state.langLanguages.push(cleanCode);
    state.langData[cleanCode] = {};
    renderLangTable();
    setUnsaved(true);
  }

  // ==========================================
  // 3. RECIPES STUDIO (CRAFTING BENCH 3x3)
  // ==========================================
  async function loadRecipes() {
    try {
      const res = await apiGet(`/api/recipes?mod=${state.currentMod}`);
      state.recipes = res.recipes || [];
      renderRecipeSidebar(state.recipes);
      renderItemsPalette();

      if (state.recipes.length > 0 && !state.currentRecipeId) {
        loadRecipeData(state.recipes[0]);
      } else {
        updateRecipeJsonPreview();
      }
    } catch (err) {
      console.error(err);
      els.recipeList.innerHTML = `<div class="empty-hint">Error: ${err.message}</div>`;
    }
  }

  function renderRecipeSidebar(recipes) {
    const filter = (els.recipeSearch.value || '').toLowerCase().trim();
    const filtered = recipes.filter(r => r.name.toLowerCase().includes(filter) || r.id.toLowerCase().includes(filter));

    els.recipeList.innerHTML = '';
    if (filtered.length === 0) {
      els.recipeList.innerHTML = '<div class="empty-hint">Sin recetas</div>';
      return;
    }

    filtered.forEach((rec) => {
      const item = document.createElement('div');
      item.className = `asset-item ${rec.id === state.currentRecipeId ? 'active' : ''}`;
      item.innerHTML = `
        <span class="asset-item-thumb" style="display:flex;align-items:center;justify-content:center;background:#2d2d3a;">⚒️</span>
        <span class="asset-item-name">${rec.name}</span>
      `;
      item.addEventListener('click', () => loadRecipeData(rec));
      els.recipeList.appendChild(item);
    });
  }

  function loadRecipeData(rec) {
    state.currentRecipeId = rec.id;
    els.recipeIdInput.value = rec.id;
    renderRecipeSidebar(state.recipes);

    const d = rec.data || {};
    els.recipeTypeSelect.value = d.type || 'minecraft:crafting_shaped';
    els.recipeCategorySelect.value = d.category || 'equipment';

    // Reset grid
    state.craftGrid = Array(9).fill(null);

    if (d.type === 'minecraft:crafting_shaped') {
      const pattern = d.pattern || [];
      const keys = d.key || {};
      for (let r = 0; r < pattern.length; r++) {
        const row = pattern[r];
        for (let c = 0; c < row.length; c++) {
          const char = row[c];
          if (char !== ' ' && keys[char]) {
            state.craftGrid[r * 3 + c] = keys[char];
          }
        }
      }
    } else if (d.type === 'minecraft:crafting_shapeless') {
      const ingredients = d.ingredients || [];
      ingredients.forEach((ing, i) => {
        if (i < 9) state.craftGrid[i] = typeof ing === 'string' ? ing : (ing.item || ing.tag || '');
      });
    }

    // Result
    if (d.result) {
      if (typeof d.result === 'string') {
        state.craftResult = { id: d.result, count: 1 };
      } else {
        state.craftResult = { id: d.result.id || d.result.item || '', count: d.result.count || 1 };
      }
    } else {
      state.craftResult = { id: `${state.currentMod}:${rec.id}`, count: 1 };
    }

    els.resultCountInput.value = state.craftResult.count;
    renderCraftGrid();
    updateRecipeJsonPreview();
  }

  function renderCraftGrid() {
    for (let i = 0; i < 9; i++) {
      const slotEl = els.craftingGrid.querySelector(`[data-slot="${i}"]`);
      const item = state.craftGrid[i];
      slotEl.innerHTML = '';
      if (item) {
        slotEl.classList.add('has-item');
        const short = item.split(':').pop();
        slotEl.innerHTML = `<span class="craft-slot-text" title="${item}">${short}</span>`;
      } else {
        slotEl.classList.remove('has-item');
      }
    }

    // Result slot
    els.resultSlot.innerHTML = '';
    if (state.craftResult.id) {
      const short = state.craftResult.id.split(':').pop();
      els.resultSlot.innerHTML = `<span class="craft-slot-text" title="${state.craftResult.id}"><strong>${short}</strong></span>`;
    }
  }

  function renderItemsPalette() {
    const filter = (els.itemPaletteFilter.value || '').toLowerCase().trim();
    const activeCat = document.querySelector('.palette-categories .cat-pill.active')?.dataset.cat || 'mod';

    let items = [];
    if (activeCat === 'mod') {
      // Mod items from models & textures
      items = textureCache.map(t => t.id).concat(state.modelsList.map(m => `${state.currentMod}:${m.stem}`));
      // Deduplicate
      items = [...new Set(items)];
      if (items.length === 0) {
        items = [`${state.currentMod}:car`, `${state.currentMod}:motorcycle`, `${state.currentMod}:motocarro`];
      }
    } else {
      items = VANILLA_RECIPE_ITEMS;
    }

    const filtered = items.filter(it => it.toLowerCase().includes(filter));
    els.itemsPaletteContainer.innerHTML = '';

    filtered.forEach((it) => {
      const chip = document.createElement('div');
      chip.className = `palette-item-chip ${it === state.activePaletteItem ? 'active' : ''}`;
      const short = it.split(':').pop();
      chip.textContent = short;
      chip.title = it;
      chip.addEventListener('click', () => {
        state.activePaletteItem = it;
        els.activeItemBadge.textContent = it;
        renderItemsPalette();
      });
      els.itemsPaletteContainer.appendChild(chip);
    });
  }

  function generateRecipeJson() {
    const type = els.recipeTypeSelect.value;
    const category = els.recipeCategorySelect.value;
    const resultId = state.craftResult.id || `${state.currentMod}:${els.recipeIdInput.value || 'item'}`;
    const resultCount = parseInt(els.resultCountInput.value, 10) || 1;

    if (type === 'minecraft:crafting_shaped') {
      // Build keys map and 3x3 pattern
      const keyMap = {};
      const keyChars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
      let charIdx = 0;

      const rawGrid = [
        [state.craftGrid[0], state.craftGrid[1], state.craftGrid[2]],
        [state.craftGrid[3], state.craftGrid[4], state.craftGrid[5]],
        [state.craftGrid[6], state.craftGrid[7], state.craftGrid[8]]
      ];

      // Assign letters to unique items
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const item = rawGrid[r][c];
          if (item && !keyMap[item]) {
            keyMap[item] = keyChars[charIdx++];
          }
        }
      }

      // Build pattern rows
      const pattern = [];
      for (let r = 0; r < 3; r++) {
        let rowStr = '';
        for (let c = 0; c < 3; c++) {
          const item = rawGrid[r][c];
          rowStr += item ? keyMap[item] : ' ';
        }
        pattern.push(rowStr);
      }

      // Inverted keys: { "A": "minecraft:iron_ingot" }
      const keyDef = {};
      for (const [item, char] of Object.entries(keyMap)) {
        keyDef[char] = item;
      }

      return {
        type: "minecraft:crafting_shaped",
        category: category,
        pattern: pattern,
        key: keyDef,
        result: {
          id: resultId,
          count: resultCount
        }
      };
    } else {
      // Shapeless
      const ingredients = state.craftGrid.filter(Boolean);
      return {
        type: "minecraft:crafting_shapeless",
        category: category,
        ingredients: ingredients,
        result: {
          id: resultId,
          count: resultCount
        }
      };
    }
  }

  function updateRecipeJsonPreview() {
    const json = generateRecipeJson();
    els.recipeJsonPreview.textContent = JSON.stringify(json, null, 2);
  }

  async function saveCurrentRecipe() {
    const recipeId = (els.recipeIdInput.value || '').trim();
    if (!recipeId) {
      showToast('Debes ingresar un ID de receta', 'error');
      return;
    }
    const json = generateRecipeJson();
    const relPath = `data/${state.currentMod}/recipe/${recipeId}.json`;

    try {
      await apiPost('/api/save', {
        mod: state.currentMod,
        path: relPath,
        type: 'text',
        content: JSON.stringify(json, null, '\t') + '\n'
      });
      setUnsaved(false);
      showToast(`Receta guardada: ${relPath}`, 'success');
      loadRecipes();
    } catch (err) {
      showToast(`Error al guardar receta: ${err.message}`, 'error');
    }
  }

  // ==========================================
  // 4. MODELS & ITEMS JSON STUDIO
  // ==========================================
  async function loadModelsList() {
    try {
      const treeRes = await apiGet(`/api/tree?mod=${state.currentMod}`);
      state.modelsList = [];

      function walk(nodes) {
        nodes.forEach((n) => {
          if (n.isDir && n.children) {
            walk(n.children);
          } else if (n.type === 'model' || (n.path.includes('models') && n.path.endsWith('.json')) || (n.path.includes('items') && n.path.endsWith('.json'))) {
            state.modelsList.push({
              path: n.path,
              name: n.name,
              stem: n.name.replace(/\.json$/, '')
            });
          }
        });
      }

      walk(treeRes.tree || []);
      renderModelsSidebar(state.modelsList);

      if (state.modelsList.length > 0 && !state.currentModelPath) {
        loadModelFile(state.modelsList[0].path);
      }
    } catch (err) {
      console.error(err);
      els.modelsList.innerHTML = `<div class="empty-hint">Error: ${err.message}</div>`;
    }
  }

  function renderModelsSidebar(models) {
    const filter = (els.modelsSearch.value || '').toLowerCase().trim();
    const filtered = models.filter(m => m.name.toLowerCase().includes(filter) || m.path.toLowerCase().includes(filter));

    els.modelsList.innerHTML = '';
    if (filtered.length === 0) {
      els.modelsList.innerHTML = '<div class="empty-hint">Sin modelos</div>';
      return;
    }

    filtered.forEach((m) => {
      const item = document.createElement('div');
      item.className = `asset-item ${m.path === state.currentModelPath ? 'active' : ''}`;
      item.innerHTML = `
        <span class="asset-item-thumb" style="display:flex;align-items:center;justify-content:center;background:#1e293b;">📦</span>
        <span class="asset-item-name" title="${m.path}">${m.name}</span>
      `;
      item.addEventListener('click', () => loadModelFile(m.path));
      els.modelsList.appendChild(item);
    });
  }

  async function loadModelFile(relPath) {
    try {
      state.currentModelPath = relPath;
      renderModelsSidebar(state.modelsList);
      els.activeModelPath.textContent = relPath;

      const res = await apiGet(`/api/file?mod=${state.currentMod}&path=${encodeURIComponent(relPath)}`);
      els.modelJsonEditor.value = res.content || '';
      validateAndSyncModelForm();
    } catch (err) {
      showToast(`Error al cargar modelo: ${err.message}`, 'error');
    }
  }

  function validateAndSyncModelForm() {
    try {
      const obj = JSON.parse(els.modelJsonEditor.value);
      els.jsonValidationMsg.textContent = 'JSON Válido';
      els.jsonValidationMsg.className = 'validation-msg success';

      // Sync form fields
      els.modelParentInput.value = obj.parent || '';
      const textures = obj.textures || {};
      els.layer0Input.value = textures.layer0 || '';
      els.layer1Input.value = textures.layer1 || '';
      els.layer2Input.value = textures.layer2 || '';

      updateCompositePreview(textures.layer0, textures.layer1);
    } catch (err) {
      els.jsonValidationMsg.textContent = `Error JSON: ${err.message}`;
      els.jsonValidationMsg.className = 'validation-msg error';
    }
  }

  function syncFormToJson() {
    try {
      let obj = {};
      try {
        obj = JSON.parse(els.modelJsonEditor.value);
      } catch {
        obj = {};
      }

      if (els.modelParentInput.value) {
        obj.parent = els.modelParentInput.value;
      }
      if (!obj.textures) obj.textures = {};

      if (els.layer0Input.value) obj.textures.layer0 = els.layer0Input.value;
      else delete obj.textures.layer0;

      if (els.layer1Input.value) obj.textures.layer1 = els.layer1Input.value;
      else delete obj.textures.layer1;

      if (els.layer2Input.value) obj.textures.layer2 = els.layer2Input.value;
      else delete obj.textures.layer2;

      els.modelJsonEditor.value = JSON.stringify(obj, null, '\t');
      validateAndSyncModelForm();
      setUnsaved(true);
    } catch (e) {
      console.error(e);
    }
  }

  async function updateCompositePreview(layer0Id, layer1Id) {
    if (!compCtx) return;
    compCtx.clearRect(0, 0, 128, 128);

    async function fetchTextureImg(id) {
      if (!id) return null;
      // id is like "garage:item/car" or "item/car"
      const parts = id.split(':');
      const namespace = parts.length > 1 ? parts[0] : state.currentMod;
      const sub = parts.length > 1 ? parts[1] : parts[0];
      const relPath = `assets/${namespace}/textures/${sub}.png`;
      try {
        const res = await apiGet(`/api/file?mod=${state.currentMod}&path=${encodeURIComponent(relPath)}`);
        if (res.type === 'image' && res.data) {
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            img.src = res.data;
          });
          return img;
        }
      } catch {
        return null;
      }
      return null;
    }

    const [img0, img1] = await Promise.all([
      fetchTextureImg(layer0Id),
      fetchTextureImg(layer1Id)
    ]);

    compCtx.imageSmoothingEnabled = false;
    if (img0) compCtx.drawImage(img0, 0, 0, 128, 128);
    if (img1) compCtx.drawImage(img1, 0, 0, 128, 128);
  }

  async function saveModelJson() {
    if (!state.currentModelPath) {
      showToast('No hay modelo seleccionado', 'error');
      return;
    }
    try {
      JSON.parse(els.modelJsonEditor.value); // validate first
      await apiPost('/api/save', {
        mod: state.currentMod,
        path: state.currentModelPath,
        type: 'text',
        content: els.modelJsonEditor.value
      });
      setUnsaved(false);
      showToast(`Modelo guardado: ${state.currentModelPath}`, 'success');
    } catch (err) {
      showToast(`Error al guardar: ${err.message}`, 'error');
    }
  }

  // ==========================================
  // 5. EXPLORER TAB & TREE VIEW
  // ==========================================
  async function loadExplorerTree() {
    try {
      const res = await apiGet(`/api/tree?mod=${state.currentMod}`);
      state.treeData = res.tree || [];
      renderExplorerTree();
    } catch (err) {
      console.error(err);
      els.explorerTree.innerHTML = `<div class="empty-hint">Error: ${err.message}</div>`;
    }
  }

  function renderExplorerTree() {
    els.explorerTree.innerHTML = '';
    renderNodes(state.treeData, els.explorerTree);
    refreshIcons();

    function renderNodes(nodes, container) {
      nodes.forEach((node) => {
        if (!nodeMatchesFilter(node, state.explorerFilter)) return;

        const row = document.createElement('div');
        row.className = `tree-node ${state.explorerActiveFile?.path === node.path ? 'active' : ''}`;

        const icon = node.isDir ? '<i data-lucide="folder"></i>' : getFileIcon(node.type);
        row.innerHTML = `<span class="tree-icon">${icon}</span> <span class="tree-label">${escapeHtml(node.name)}</span>`;

        row.addEventListener('click', (e) => {
          e.stopPropagation();
          if (node.isDir) {
            const childDiv = row.nextElementSibling;
            if (childDiv && childDiv.classList.contains('tree-children')) {
              childDiv.style.display = childDiv.style.display === 'none' ? 'block' : 'none';
            }
          } else {
            selectExplorerFile(node);
          }
        });

        container.appendChild(row);

        if (node.isDir && node.children && node.children.length > 0) {
          const childrenCont = document.createElement('div');
          childrenCont.className = 'tree-children';
          renderNodes(node.children, childrenCont);
          container.appendChild(childrenCont);
        }
      });
    }
  }

  function nodeMatchesFilter(node, filter) {
    if (filter === 'all' || node.isDir) return true;
    if (filter === 'texture') return node.type === 'texture';
    if (filter === 'json') return node.name.endsWith('.json');
    if (filter === 'lang') return node.type === 'lang';
    if (filter === 'recipe') return node.type === 'recipe';
    return true;
  }

  function getFileIcon(type) {
    switch (type) {
      case 'texture': return '<i data-lucide="image"></i>';
      case 'recipe': return '<i data-lucide="anvil"></i>';
      case 'lang': return '<i data-lucide="languages"></i>';
      case 'model': return '<i data-lucide="box"></i>';
      default: return '<i data-lucide="file-text"></i>';
    }
  }

  async function selectExplorerFile(node) {
    state.explorerActiveFile = node;
    els.explorerActiveFile.textContent = node.path;
    els.btnExplorerDelete.style.display = 'inline-flex';
    els.btnExplorerSave.style.display = node.type !== 'texture' ? 'inline-flex' : 'none';

    renderExplorerTree();

    try {
      const res = await apiGet(`/api/file?mod=${state.currentMod}&path=${encodeURIComponent(node.path)}`);
      els.explorerPreview.innerHTML = '';

      if (res.type === 'image') {
        const wrap = document.createElement('div');
        wrap.style.textAlign = 'center';
        wrap.innerHTML = `
          <img src="${res.data}" style="image-rendering:pixelated; width: 180px; height: 180px; object-fit: contain; border: 2px solid #373a46; border-radius: 6px; background: #18191e; padding: 10px;" />
          <div style="margin-top: 14px;">
            <button class="btn btn-primary" id="btnOpenInPixelStudio">✏️ Abrir en Editor de Texturas</button>
          </div>
        `;
        els.explorerPreview.appendChild(wrap);
        document.getElementById('btnOpenInPixelStudio').addEventListener('click', () => {
          switchTab('textures');
          loadTextureIntoCanvas(node.path);
        });
      } else {
        const txtArea = document.createElement('textarea');
        txtArea.id = 'explorerTextEditor';
        txtArea.style.width = '100%';
        txtArea.style.height = '100%';
        txtArea.style.background = '#14151a';
        txtArea.style.color = '#a5f3fc';
        txtArea.style.fontFamily = 'var(--font-mono)';
        txtArea.style.fontSize = '0.85rem';
        txtArea.style.padding = '12px';
        txtArea.style.border = '1px solid var(--border-color)';
        txtArea.style.borderRadius = '6px';
        txtArea.value = res.content || '';
        els.explorerPreview.appendChild(txtArea);
      }
    } catch (err) {
      els.explorerPreview.innerHTML = `<div class="empty-hint">Error: ${err.message}</div>`;
    }
  }

  // ==========================================
  // EVENT LISTENERS & SHORTCUTS
  // ==========================================
  function setupEventListeners() {
    // Mod Selector
    els.modSelect.addEventListener('change', (e) => {
      state.currentMod = e.target.value;
      state.currentTexturePath = '';
      state.currentRecipeId = '';
      state.currentModelPath = '';
      reloadActiveMod();
    });

    els.refreshModsBtn.addEventListener('click', loadMods);

    // 3D Viewport Controls
    if (els.btnToggle3D) els.btnToggle3D.addEventListener('click', () => toggle3DViewer());
    if (els.btnClose3DViewport) els.btnClose3DViewport.addEventListener('click', () => toggle3DViewer(false));
    if (els.select3DLayers) els.select3DLayers.addEventListener('change', apply3DLayerVisibility);
    if (els.color3DVehicleTint) {
      els.color3DVehicleTint.addEventListener('input', (e) => {
        if (threeBodyGroup) {
          threeBodyGroup.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.color.set(e.target.value);
            }
          });
        }
      });
    }

    // 3D Mode Switching Buttons (Orbit, Pick UV, Paint 3D)
    els.mode3DBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        els.mode3DBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mode3D = btn.dataset.mode3d;

        if (threeControls) {
          threeControls.enabled = (mode3D === 'orbit');
        }

        if (els.container3DCanvas) {
          els.container3DCanvas.style.cursor = mode3D === 'orbit' ? 'grab' : (mode3D === 'paint' ? 'crosshair' : 'pointer');
        }

        if (els.hover3DPartBadge) {
          if (mode3D === 'pick_uv') {
            els.hover3DPartBadge.textContent = '🎯 Clic en cualquier pieza 3D para enfocar su textura 2D en el lienzo';
            els.hover3DPartBadge.style.color = '#38bdf8';
          } else if (mode3D === 'paint') {
            els.hover3DPartBadge.textContent = '🖌️ Haz clic sobre el modelo 3D para pintarlo directamente';
            els.hover3DPartBadge.style.color = '#4ade80';
          } else {
            els.hover3DPartBadge.textContent = 'Modo Orbitar';
            els.hover3DPartBadge.style.color = '#94a3b8';
          }
        }
      });
    });

    // 3D Camera Presets (Iso, Front, Back, Left, Right, Top)
    els.camPresetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        els.camPresetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        set3DCameraPreset(btn.dataset.cam);
      });
    });

    // 3D Kinematics Sliders
    if (els.slider3DSteer) {
      els.slider3DSteer.addEventListener('input', (e) => {
        if (els.val3DSteer) els.val3DSteer.textContent = `${e.target.value}°`;
        apply3DKinematics();
      });
    }

    if (els.slider3DLean) {
      els.slider3DLean.addEventListener('input', (e) => {
        if (els.val3DLean) els.val3DLean.textContent = `${e.target.value}°`;
        apply3DKinematics();
      });
    }

    if (els.btnReset3DPose) {
      els.btnReset3DPose.addEventListener('click', () => {
        if (els.slider3DSteer) els.slider3DSteer.value = 0;
        if (els.val3DSteer) els.val3DSteer.textContent = '0°';
        if (els.slider3DLean) els.slider3DLean.value = 0;
        if (els.val3DLean) els.val3DLean.textContent = '0°';
        apply3DKinematics();
        reset3DCamera();
      });
    }

    // 3D Visual Options
    if (els.check3DWireframe) els.check3DWireframe.addEventListener('change', update3DMaterials);
    if (els.check3DAlphaCutout) els.check3DAlphaCutout.addEventListener('change', update3DMaterials);
    if (els.check3DScaleBlock) {
      els.check3DScaleBlock.addEventListener('change', (e) => {
        if (threeScaleBlock) threeScaleBlock.visible = e.target.checked;
      });
    }
    if (els.select3DModelOverride) {
      els.select3DModelOverride.addEventListener('change', () => {
        load3DModelForCurrentTexture();
      });
    }
    if (els.btnSnapshot3D) {
      els.btnSnapshot3D.addEventListener('click', take3DSnapshot);
    }

    // 3D Panel Resizer (Draggable separator)
    let isResizing3D = false;
    let resizeStartX = 0;
    let resizeStartWidth = 0;

    if (els.resizer3D) {
      els.resizer3D.addEventListener('mousedown', (e) => {
        isResizing3D = true;
        resizeStartX = e.clientX;
        resizeStartWidth = els.panel3DViewport.offsetWidth;
        els.resizer3D.classList.add('dragging');
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isResizing3D) return;
        const delta = resizeStartX - e.clientX;
        const maxW = Math.floor(window.innerWidth * 0.75);
        const newW = Math.max(280, Math.min(maxW, resizeStartWidth + delta));
        els.panel3DViewport.style.width = `${newW}px`;
        onWindowResize3D();
      });

      window.addEventListener('mouseup', () => {
        if (isResizing3D) {
          isResizing3D = false;
          if (els.resizer3D) els.resizer3D.classList.remove('dragging');
          document.body.style.userSelect = '';
          document.body.style.cursor = '';
          onWindowResize3D();
        }
      });
    }

    // 3D Panel Expand / Collapse width
    if (els.btnExpand3D) {
      let isExpanded = false;
      els.btnExpand3D.addEventListener('click', () => {
        isExpanded = !isExpanded;
        if (isExpanded) {
          els.panel3DViewport.style.width = '60%';
          els.btnExpand3D.innerHTML = '<i data-lucide="minimize-2"></i>';
        } else {
          els.panel3DViewport.style.width = '420px';
          els.btnExpand3D.innerHTML = '<i data-lucide="maximize-2"></i>';
        }
        refreshIcons();
        setTimeout(onWindowResize3D, 50);
      });
    }

    // UV Guide overlay toggle on 2D canvas
    if (els.toggleUVGuide) {
      els.toggleUVGuide.addEventListener('change', () => {
        drawGrid();
      });
    }

    // Nav Tabs
    els.navTabs.forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Global Save
    els.globalSaveBtn.addEventListener('click', performContextualSave);

    // Textures Tool Buttons (Only drawing tools)
    els.toolBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!btn.dataset.tool) return;
        setActiveTool(btn.dataset.tool);
      });
    });

    els.brushSize.addEventListener('change', (e) => {
      state.brushSize = parseInt(e.target.value, 10);
    });

    els.toggleGrid.addEventListener('change', (e) => {
      state.showGrid = e.target.checked;
      drawGrid();
    });

    // Zoom Buttons
    els.btnZoomIn.addEventListener('click', () => {
      if (state.zoom < 48) {
        state.zoom += (state.zoom >= 12 ? 4 : 2);
        updateCanvasDisplay();
        drawGrid();
      }
    });

    els.btnZoomOut.addEventListener('click', () => {
      if (state.zoom > 2) {
        state.zoom -= (state.zoom > 12 ? 4 : 2);
        if (state.zoom < 2) state.zoom = 2;
        updateCanvasDisplay();
        drawGrid();
      }
    });

    els.btnZoomReset.addEventListener('click', () => {
      if (state.textureWidth >= 128) {
        state.zoom = 4;
      } else if (state.textureWidth >= 64) {
        state.zoom = 8;
      } else {
        state.zoom = 16;
      }
      updateCanvasDisplay();
      drawGrid();
      if (els.canvasViewport) {
        els.canvasViewport.scrollLeft = 0;
        els.canvasViewport.scrollTop = 0;
      }
    });

    // Mouse Wheel on Viewport for Zoom
    els.canvasViewport.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey || state.tool === 'pan') {
        e.preventDefault();
        const delta = e.deltaY < 0 ? (state.zoom >= 12 ? 2 : 1) : -(state.zoom > 12 ? 2 : 1);
        const newZoom = Math.max(2, Math.min(48, state.zoom + delta));
        if (newZoom !== state.zoom) {
          state.zoom = newZoom;
          updateCanvasDisplay();
          drawGrid();
        }
      }
    }, { passive: false });

    // 2D Canvas Navigation (Pan with Spacebar, Middle-click or Hand tool)
    let isPanningCanvas = false;
    let panStartX = 0;
    let panStartY = 0;
    let panScrollStartX = 0;
    let panScrollStartY = 0;
    let isSpacebarDown = false;

    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.code === 'Space' && !e.repeat) {
        isSpacebarDown = true;
        els.canvasViewport.style.cursor = 'grab';
        e.preventDefault();
      }

      // Quick tool shortcuts
      if (!e.ctrlKey && !e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'p') setActiveTool('pen');
        else if (k === 'e') setActiveTool('eraser');
        else if (k === 'i') setActiveTool('picker');
        else if (k === 'g') setActiveTool('bucket');
        else if (k === 'h') setActiveTool('pan');
        else if (k === 'm') toggle3DViewer();
      } else if (e.key.toLowerCase() === 'z') {
        if (e.shiftKey) redo(); else undo();
        e.preventDefault();
      } else if (e.key.toLowerCase() === 'y') {
        redo();
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        isSpacebarDown = false;
        updateCanvasCursor();
      }
    });

    function updateCanvasCursor() {
      if (!els.canvasViewport) return;
      if (state.tool === 'pan' || isSpacebarDown) {
        els.canvasViewport.style.cursor = isPanningCanvas ? 'grabbing' : 'grab';
      } else if (state.tool === 'picker') {
        els.canvasViewport.style.cursor = 'crosshair';
      } else {
        els.canvasViewport.style.cursor = 'crosshair';
      }
    }

    // Canvas Viewport Mouse Events (Draw + Pan)
    els.canvasViewport.addEventListener('mousedown', (e) => {
      // Middle click, spacebar drag, or Hand tool: start panning
      if (e.button === 1 || isSpacebarDown || state.tool === 'pan') {
        e.preventDefault();
        isPanningCanvas = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        panScrollStartX = els.canvasViewport.scrollLeft;
        panScrollStartY = els.canvasViewport.scrollTop;
        els.canvasViewport.style.cursor = 'grabbing';
        return;
      }

      // Left click on pixel canvas for drawing
      if (e.button === 0 && e.target === els.pixelCanvas && state.tool !== 'pan') {
        pushUndo();
        state.isDrawing = true;
        const coords = getPixelCoords(e);
        applyPixelTool(coords.x, coords.y);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isPanningCanvas) {
        const dx = e.clientX - panStartX;
        const dy = e.clientY - panStartY;
        els.canvasViewport.scrollLeft = panScrollStartX - dx;
        els.canvasViewport.scrollTop = panScrollStartY - dy;
        return;
      }

      if (state.isDrawing) {
        const coords = getPixelCoords(e);
        els.canvasCoords.textContent = `X: ${coords.x} | Y: ${coords.y}`;
        applyPixelTool(coords.x, coords.y);
      } else if (e.target === els.pixelCanvas) {
        const coords = getPixelCoords(e);
        els.canvasCoords.textContent = `X: ${coords.x} | Y: ${coords.y}`;
      }
    });

    window.addEventListener('mouseup', () => {
      if (isPanningCanvas) {
        isPanningCanvas = false;
        updateCanvasCursor();
      }
      if (state.isDrawing) {
        state.isDrawing = false;
        extractImagePalette();
      }
    });

    // Undo / Redo
    els.btnUndo.addEventListener('click', undo);
    els.btnRedo.addEventListener('click', redo);

    // Color Pickers
    els.primaryColor.addEventListener('input', (e) => setPrimaryColor(e.target.value, state.primaryAlpha));
    els.hexInput.addEventListener('change', (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        setPrimaryColor(val, state.primaryAlpha);
      }
    });

    els.alphaSlider.addEventListener('input', (e) => {
      state.primaryAlpha = parseInt(e.target.value, 10);
      els.alphaValue.textContent = `${Math.round((state.primaryAlpha / 255) * 100)}%`;
    });

    // Texture Sidebar Search & Clear
    if (els.textureSearch) {
      els.textureSearch.addEventListener('input', () => renderTextureSidebar(textureCache));
    }
    if (els.btnClearTextureSearch) {
      els.btnClearTextureSearch.addEventListener('click', () => {
        if (els.textureSearch) els.textureSearch.value = '';
        renderTextureSidebar(textureCache);
      });
    }

    // Category Filter Chips
    if (els.textureCategoryFilters) {
      els.textureCategoryFilters.querySelectorAll('.filter-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          els.textureCategoryFilters.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          activeTextureCategory = chip.dataset.cat || 'all';
          renderTextureSidebar(textureCache);
        });
      });
    }

    // Secondary Trim Overlay
    els.toggleTrimOverlay.addEventListener('change', (e) => {
      els.trimSelect.style.display = e.target.checked ? 'inline-block' : 'none';
      if (!e.target.checked && oCtx) {
        oCtx.clearRect(0, 0, state.textureWidth, state.textureHeight);
      } else if (e.target.checked && els.trimSelect.value) {
        loadOverlayTexture(els.trimSelect.value);
      }
    });

    els.trimSelect.addEventListener('change', (e) => {
      if (e.target.value) loadOverlayTexture(e.target.value);
    });

    async function loadOverlayTexture(path) {
      try {
        const res = await apiGet(`/api/file?mod=${state.currentMod}&path=${encodeURIComponent(path)}`);
        const img = new Image();
        img.onload = () => {
          oCtx.clearRect(0, 0, state.textureWidth, state.textureHeight);
          oCtx.drawImage(img, 0, 0, state.textureWidth, state.textureHeight);
        };
        img.src = res.data;
      } catch (e) {
        console.error(e);
      }
    }

    els.btnSaveTexture.addEventListener('click', saveActiveTexture);
    els.btnExportPng.addEventListener('click', downloadTexturePng);

    // Lang Listeners
    els.langSearch.addEventListener('input', renderLangTable);
    els.filterMissingOnly.addEventListener('change', renderLangTable);
    els.btnAddLangKey.addEventListener('click', addNewLangKey);
    els.btnAddLangCode.addEventListener('click', addNewLanguageCode);
    els.btnSaveLangs.addEventListener('click', saveLangs);

    // Recipe Listeners
    els.recipeSearch.addEventListener('input', () => renderRecipeSidebar(state.recipes));
    els.itemPaletteFilter.addEventListener('input', renderItemsPalette);
    document.querySelectorAll('.palette-categories .cat-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.palette-categories .cat-pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        renderItemsPalette();
      });
    });

    els.btnUseCustomItem.addEventListener('click', () => {
      const val = els.customItemInput.value.trim();
      if (val) {
        state.activePaletteItem = val;
        els.activeItemBadge.textContent = val;
        showToast(`Ítem activo: ${val}`);
      }
    });

    // 3x3 Grid Slot clicks
    els.craftingGrid.querySelectorAll('.craft-slot').forEach((slot) => {
      slot.addEventListener('click', (e) => {
        const idx = parseInt(slot.dataset.slot, 10);
        state.craftGrid[idx] = state.activePaletteItem;
        renderCraftGrid();
        updateRecipeJsonPreview();
        setUnsaved(true);
      });
      slot.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const idx = parseInt(slot.dataset.slot, 10);
        state.craftGrid[idx] = null;
        renderCraftGrid();
        updateRecipeJsonPreview();
        setUnsaved(true);
      });
    });

    // Result Slot click
    els.resultSlot.addEventListener('click', () => {
      state.craftResult.id = state.activePaletteItem;
      renderCraftGrid();
      updateRecipeJsonPreview();
      setUnsaved(true);
    });

    els.resultCountInput.addEventListener('input', () => {
      state.craftResult.count = parseInt(els.resultCountInput.value, 10) || 1;
      updateRecipeJsonPreview();
    });

    els.recipeTypeSelect.addEventListener('change', updateRecipeJsonPreview);
    els.recipeCategorySelect.addEventListener('change', updateRecipeJsonPreview);
    els.btnClearGrid.addEventListener('click', () => {
      state.craftGrid = Array(9).fill(null);
      renderCraftGrid();
      updateRecipeJsonPreview();
      setUnsaved(true);
    });

    els.btnSaveCurrentRecipe.addEventListener('click', saveCurrentRecipe);
    els.btnCopyRecipeJson.addEventListener('click', () => {
      const text = els.recipeJsonPreview.textContent;
      navigator.clipboard.writeText(text);
      showToast('JSON copiado al portapapeles');
    });

    els.btnNewRecipe.addEventListener('click', () => {
      const id = prompt('Introduce el ID de la nueva receta (ej: titanium_engine):');
      if (!id || !id.trim()) return;
      state.currentRecipeId = id.trim();
      els.recipeIdInput.value = id.trim();
      state.craftGrid = Array(9).fill(null);
      state.craftResult = { id: `${state.currentMod}:${id.trim()}`, count: 1 };
      renderCraftGrid();
      updateRecipeJsonPreview();
      setUnsaved(true);
    });

    // Models Listeners
    els.modelsSearch.addEventListener('input', () => renderModelsSidebar(state.modelsList));
    els.modelJsonEditor.addEventListener('input', () => {
      validateAndSyncModelForm();
      setUnsaved(true);
    });

    [els.modelParentInput, els.layer0Input, els.layer1Input, els.layer2Input].forEach((inp) => {
      inp.addEventListener('input', syncFormToJson);
    });

    els.btnFormatJson.addEventListener('click', () => {
      try {
        const obj = JSON.parse(els.modelJsonEditor.value);
        els.modelJsonEditor.value = JSON.stringify(obj, null, '\t');
        validateAndSyncModelForm();
        showToast('JSON formateado');
      } catch (e) {
        showToast(`JSON inválido: ${e.message}`, 'error');
      }
    });

    els.btnValidateJson.addEventListener('click', validateAndSyncModelForm);
    els.btnSaveModelJson.addEventListener('click', saveModelJson);

    // Explorer Filter Pills
    document.querySelectorAll('.filter-pills .pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        state.explorerFilter = e.target.dataset.filter;
        renderExplorerTree();
      });
    });

    els.btnExplorerSave.addEventListener('click', async () => {
      if (!state.explorerActiveFile) return;
      const editor = document.getElementById('explorerTextEditor');
      if (!editor) return;
      try {
        await apiPost('/api/save', {
          mod: state.currentMod,
          path: state.explorerActiveFile.path,
          type: 'text',
          content: editor.value
        });
        setUnsaved(false);
        showToast(`Archivo guardado: ${state.explorerActiveFile.path}`, 'success');
      } catch (err) {
        showToast(`Error al guardar: ${err.message}`, 'error');
      }
    });

    els.btnExplorerDelete.addEventListener('click', async () => {
      if (!state.explorerActiveFile) return;
      if (confirm(`¿Estás seguro de eliminar "${state.explorerActiveFile.path}"?`)) {
        try {
          await apiPost('/api/delete-file', {
            mod: state.currentMod,
            path: state.explorerActiveFile.path
          });
          showToast('Archivo eliminado', 'success');
          state.explorerActiveFile = null;
          els.explorerActiveFile.textContent = 'Selecciona un archivo del árbol';
          els.explorerPreview.innerHTML = '';
          els.btnExplorerDelete.style.display = 'none';
          els.btnExplorerSave.style.display = 'none';
          loadExplorerTree();
        } catch (err) {
          showToast(`Error: ${err.message}`, 'error');
        }
      }
    });

    // New File Modals
    els.btnNewTexture.addEventListener('click', () => {
      openNewFileModal(`assets/${state.currentMod}/textures/item/nueva_textura.png`, 'texture16');
    });

    els.btnExplorerNewFile.addEventListener('click', () => {
      openNewFileModal(`assets/${state.currentMod}/models/item/nuevo_modelo.json`, 'itemModel');
    });

    els.btnCloseModal.addEventListener('click', closeNewFileModal);
    els.btnCancelModal.addEventListener('click', closeNewFileModal);
    els.btnConfirmCreateFile.addEventListener('click', handleCreateFile);

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        performContextualSave();
      }
      // Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (state.activeTab === 'textures') {
          e.preventDefault();
          undo();
        }
      }
      // Ctrl+Y or Ctrl+Shift+Z
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) {
        if (state.activeTab === 'textures') {
          e.preventDefault();
          redo();
        }
      }
      // Single Key Tool Shortcuts (only if not focused in an input)
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        if (e.key.toLowerCase() === 'm') {
          toggle3DViewer();
        } else if (e.key.toLowerCase() === 'p') {
          selectTool('pen');
        } else if (e.key.toLowerCase() === 'e') {
          selectTool('eraser');
        } else if (e.key.toLowerCase() === 'i') {
          selectTool('picker');
        } else if (e.key.toLowerCase() === 'g') {
          selectTool('bucket');
        }
      }
    });
  }

  function selectTool(toolName) {
    state.tool = toolName;
    els.toolBtns.forEach(b => b.classList.toggle('active', b.dataset.tool === toolName));
  }

  function performContextualSave() {
    if (state.activeTab === 'textures') {
      saveActiveTexture();
    } else if (state.activeTab === 'langs') {
      saveLangs();
    } else if (state.activeTab === 'recipes') {
      saveCurrentRecipe();
    } else if (state.activeTab === 'models') {
      saveModelJson();
    } else if (state.activeTab === 'explorer') {
      els.btnExplorerSave.click();
    }
  }

  function openNewFileModal(defaultPath, defaultTemplate) {
    els.newFilePathInput.value = defaultPath;
    els.newFileTemplateSelect.value = defaultTemplate;
    els.modalNewFile.style.display = 'flex';
  }

  function closeNewFileModal() {
    els.modalNewFile.style.display = 'none';
  }

  async function handleCreateFile() {
    const relPath = els.newFilePathInput.value.trim();
    const template = els.newFileTemplateSelect.value;
    if (!relPath) return;

    let content = '';
    let isImage = false;

    if (template === 'texture16' || template === 'texture32') {
      isImage = true;
      const dim = template === 'texture16' ? 16 : 32;
      const tempC = document.createElement('canvas');
      tempC.width = dim;
      tempC.height = dim;
      content = tempC.toDataURL('image/png');
    } else if (template === 'itemModel') {
      const stem = relPath.split('/').pop().replace(/\.json$/, '');
      content = JSON.stringify({
        parent: "minecraft:item/generated",
        textures: {
          layer0: `${state.currentMod}:item/${stem}`
        }
      }, null, '\t') + '\n';
    } else if (template === 'recipe') {
      const stem = relPath.split('/').pop().replace(/\.json$/, '');
      content = JSON.stringify({
        type: "minecraft:crafting_shaped",
        category: "equipment",
        pattern: [" I ", " I ", " I "],
        key: { "I": "minecraft:iron_ingot" },
        result: { id: `${state.currentMod}:${stem}`, count: 1 }
      }, null, '\t') + '\n';
    }

    try {
      if (isImage) {
        await apiPost('/api/save', {
          mod: state.currentMod,
          path: relPath,
          type: 'image',
          content: content
        });
      } else {
        await apiPost('/api/create-file', {
          mod: state.currentMod,
          path: relPath,
          content: content
        });
      }

      closeNewFileModal();
      showToast(`Archivo creado: ${relPath}`, 'success');
      await reloadActiveMod();

      if (isImage) {
        switchTab('textures');
        loadTextureIntoCanvas(relPath);
      }
    } catch (err) {
      showToast(`Error al crear: ${err.message}`, 'error');
    }
  }

  // --- Utility Color Math ---
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function hexToRgba(hex, alpha = 255) {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha / 255})`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run app
  init();
})();

