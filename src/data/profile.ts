import type { Locale } from '../i18n/ui'

export type L = Record<Locale, string>

export interface Project {
  id: string
  name: string
  date: L
  tagline: L
  description: L
  highlights: L[]
  formats: string[]
  stack: string[]
  live?: string
  source: string
  image?: string
  imageAlt?: L
}

export interface Contribution {
  project: string
  org: string
  url: string
  title: string
  date: L
  status: L
  language: string
  additions: number
  deletions: number
  files: number
  tagline: L
  highlights: L[]
}

export interface FormatConstant {
  fmt: string
  bytes: string
  hint?: string
  ascii?: string
  note: L
}

export interface SkillGroup {
  group: L
  items: (string | L)[]
}

export const profile = {
  alias: 'noxx',
  fullName: '',
  handle: 'noxxUY',
  role: { en: 'Frontend Developer', es: 'Desarrollador Frontend' } satisfies L,
  roleLine: {
    en: 'Frontend Developer. TypeScript, React and WebGL in the browser; C++ and reverse engineering underneath.',
    es: 'Desarrollador Frontend. TypeScript, React y WebGL en el navegador; C++ y reverse engineering por debajo.',
  } satisfies L,
  summary: {
    en: 'I build browser-only tools that open binary game formats: Minecraft worlds and GTA archives, parsed and rendered in 3D on the client, nothing uploaded. I am comfortable below the surface too: C++, reverse engineering with IDA Pro and undocumented file formats.',
    es: 'Construyo herramientas que corren solo en el navegador y abren formatos binarios de juegos: mundos de Minecraft y archivos de GTA, parseados y renderizados en 3D en el cliente, sin subir nada. También me muevo cómodo por debajo: C++, reverse engineering con IDA Pro y formatos de archivo sin documentar.',
  } satisfies L,
  location: { en: 'Uruguay', es: 'Uruguay' } satisfies L,
  countryCode: 'UY',
  timezone: 'UTC−3',
  availability: { en: 'Open to remote work', es: 'Abierto a trabajo remoto' } satisfies L,
  email: 'noxxzeraa@proton.me',
  links: {
    github: 'https://github.com/noxxUY',
    linkedin: '',
    site: 'https://noxxuy.github.io',
    siteSource: 'https://github.com/noxxUY/portfolio',
  },
  now: {
    en: 'Now: building the IMG Editor.',
    es: 'Ahora: construyendo el IMG Editor.',
  } satisfies L,

  projects: [
    {
      id: 'img-editor',
      name: 'IMG Editor',
      date: { en: 'Sep 2026 – present', es: 'sep 2026 – actualidad' },
      tagline: {
        en: 'Browser-based IMG archive editor for GTA III, Vice City and San Andreas.',
        es: 'Editor de archivos IMG de GTA III, Vice City y San Andreas que corre en el navegador.',
      },
      description: {
        en: 'Opens the game archives and lets you browse, extract, replace, add, delete and rebuild entries, with a 3D preview of every DFF model and TXD texture. Saves in place through the File System Access API. Nothing leaves your machine.',
        es: 'Abre los archivos del juego y permite explorar, extraer, reemplazar, agregar, borrar y reconstruir entradas, con vista previa 3D de cada modelo DFF y cada textura TXD. Guarda en el lugar mediante la File System Access API. Nada sale de tu máquina.',
      },
      highlights: [
        {
          en: 'RenderWare DFF and TXD parsers written from the binary format, including skinned peds and PS2-format textures.',
          es: 'Parsers de RenderWare DFF y TXD escritos desde el formato binario, incluidos peds con skin y texturas en formato PS2.',
        },
        {
          en: 'The test suite parses every model of real GTA III, Vice City and San Andreas installs.',
          es: 'La suite de tests parsea todos los modelos de instalaciones reales de GTA III, Vice City y San Andreas.',
        },
        {
          en: 'Texture lookup through .ide files, with a texture index built in the background when nothing matches.',
          es: 'Búsqueda de texturas por archivos .ide, con un índice de texturas construido en segundo plano cuando no hay coincidencia.',
        },
      ],
      formats: ['.img', '.dir', '.dff', '.txd'],
      stack: ['TypeScript', 'React', 'Vite', 'Tailwind CSS', 'Three.js', 'Vitest'],
      live: 'https://noxxuy.github.io/img-editor/',
      source: 'https://github.com/noxxUY/img-editor',
      image: 'img-editor.png',
      imageAlt: {
        en: "IMG Editor with San Andreas' gta3.img open and Cesar Vialpando rendered in the 3D viewer.",
        es: "IMG Editor con el gta3.img de San Andreas abierto y Cesar Vialpando renderizado en el visor 3D.",
      },
    },
    {
      id: 'minevisor-workspace',
      name: 'Minevisor Workspace',
      date: { en: 'Aug 2026', es: 'ago 2026' },
      tagline: {
        en: 'Read a Minecraft Java world in the browser: map, 3D terrain, players, inventories, chunks and NBT.',
        es: 'Lee un mundo de Minecraft Java en el navegador: mapa, terreno 3D, jugadores, inventarios, chunks y NBT.',
      },
      description: {
        en: 'Point it at a .minecraft save and it decodes region files and player data locally: a 2D map with player markers, a 3D voxel flythrough, side-by-side player stats, searchable inventories and raw chunk and NBT inspection. Inventories, experience and spawn points can be edited and saved back.',
        es: 'Apuntalo a una partida guardada de .minecraft y decodifica los archivos de región y los datos de jugadores localmente: mapa 2D con marcadores de jugadores, vuelo 3D por vóxeles, comparación de estadísticas entre jugadores, inventarios con búsqueda e inspección de chunks y NBT en crudo. Inventarios, experiencia y puntos de aparición se pueden editar y guardar.',
      },
      highlights: [
        {
          en: "Textures streamed from Mojang's CDN through a precomputed byte-offset index instead of bundling assets.",
          es: 'Texturas servidas desde el CDN de Mojang mediante un índice precalculado de offsets en bytes, en lugar de empaquetar assets.',
        },
        {
          en: 'Supports saves from Minecraft 1.0 onward, including the legacy terrain formats.',
          es: 'Soporta partidas desde Minecraft 1.0, incluidos los formatos de terreno antiguos.',
        },
        {
          en: 'Runs entirely client-side: no uploads, no server.',
          es: 'Corre completamente en el cliente: sin subidas, sin servidor.',
        },
      ],
      formats: ['.mca', '.dat', 'NBT'],
      stack: ['TypeScript', 'Astro', 'React', 'Three.js', 'Tailwind CSS'],
      live: 'https://minevisor.cc',
      source: 'https://github.com/noxxUY/minevisor-workspace',
      image: 'minevisor-workspace.png',
      imageAlt: {
        en: 'Minevisor Workspace with the 3D viewer flying over a Minecraft world, waypoints listed beside it.',
        es: 'Minevisor Workspace con el visor 3D sobrevolando un mundo de Minecraft y los waypoints al costado.',
      },
    },
    {
      id: 'minevisor-transfer',
      name: 'Minevisor Transfer',
      date: { en: 'Aug 2026', es: 'ago 2026' },
      tagline: {
        en: "Copy a Minecraft Java player's inventory between accounts, entirely in the browser.",
        es: 'Copia el inventario de un jugador de Minecraft Java entre cuentas, completamente en el navegador.',
      },
      description: {
        en: 'Moves the hotbar, main inventory, armor, offhand and ender chest from one account to another, offline to premium or the other way around. Resolves premium UUIDs from the Mojang API, derives offline ones locally, and writes new .dat files or straight into the world folder.',
        es: 'Mueve la barra rápida, el inventario, la armadura, la mano secundaria y el cofre de ender de una cuenta a otra, de offline a premium o al revés. Resuelve UUIDs premium desde la API de Mojang, deriva los offline localmente y escribe archivos .dat nuevos o directo en la carpeta del mundo.',
      },
      highlights: [
        {
          en: 'Works between offline and premium accounts in both directions.',
          es: 'Funciona entre cuentas offline y premium en ambas direcciones.',
        },
        {
          en: 'Shares the NBT parsing core with Minevisor Workspace.',
          es: 'Comparte el núcleo de parseo de NBT con Minevisor Workspace.',
        },
      ],
      formats: ['.dat', 'NBT'],
      stack: ['TypeScript', 'Astro', 'React', 'Tailwind CSS'],
      live: 'https://minevisor.cc',
      source: 'https://github.com/noxxUY/minevisor-transfer',
      image: 'minevisor-transfer.png',
      imageAlt: {
        en: 'Minevisor Transfer: the players found in a world on the left, the destination account on the right.',
        es: 'Minevisor Transfer: los jugadores encontrados en el mundo a la izquierda y la cuenta de destino a la derecha.',
      },
    },
  ] satisfies Project[],

  openSource: [] as Contribution[],

  formatConstants: [
    {
      fmt: '.img',
      bytes: '56 45 52 32',
      ascii: 'VER2',
      note: { en: 'Version-2 archive header', es: 'Cabecera de archivo versión 2' },
    },
    {
      fmt: '.dir',
      bytes: '',
      hint: '32 B/entry',
      note: { en: 'No magic: a flat table of 32-byte records', es: 'Sin magic: tabla plana de registros de 32 bytes' },
    },
    {
      fmt: '.dff',
      bytes: '10 00 00 00',
      note: { en: 'RenderWare clump section', es: 'Sección clump de RenderWare' },
    },
    {
      fmt: '.txd',
      bytes: '16 00 00 00',
      note: { en: 'RenderWare texture dictionary', es: 'Diccionario de texturas de RenderWare' },
    },
    {
      fmt: '.mca',
      bytes: '00 00 10 00',
      note: { en: 'Anvil sector size, 0x1000', es: 'Tamaño de sector de Anvil, 0x1000' },
    },
    {
      fmt: '.dat',
      bytes: '1f 8b',
      note: { en: 'gzip around the player NBT', es: 'gzip alrededor del NBT del jugador' },
    },
    {
      fmt: 'NBT',
      bytes: '0a',
      note: { en: 'TAG_Compound, the root tag', es: 'TAG_Compound, el tag raíz' },
    },
  ] satisfies FormatConstant[],

  skills: [
    {
      group: { en: 'Languages', es: 'Lenguajes' },
      items: ['TypeScript', 'JavaScript', 'C++', 'HTML', 'CSS'],
    },
    {
      group: { en: 'Frontend', es: 'Frontend' },
      items: [
        'React',
        'Astro',
        'Vite',
        'Tailwind CSS',
        'Three.js',
        'WebGL',
        'File System Access API',
        'Origin Private File System',
      ],
    },
    {
      group: { en: 'Tooling', es: 'Herramientas' },
      items: ['Vitest', 'Puppeteer', 'Git', 'GitHub Actions', 'npm'],
    },
    {
      group: { en: 'Low level', es: 'Bajo nivel' },
      items: [
        { en: 'Reverse engineering', es: 'Reverse engineering' },
        'IDA Pro',
        {
          en: 'Binary file formats (RenderWare DFF/TXD, IMG, Minecraft Anvil/NBT)',
          es: 'Formatos binarios (RenderWare DFF/TXD, IMG, Minecraft Anvil/NBT)',
        },
        { en: 'Game modding in C++ (GTA: San Andreas)', es: 'Modding de juegos en C++ (GTA: San Andreas)' },
      ],
    },
  ] satisfies SkillGroup[],
}

export const skillText = (item: string | L): L => (typeof item === 'string' ? { en: item, es: item } : item)

export const constantFor = (format: string) => profile.formatConstants.find((c) => c.fmt === format)

export const displayName = profile.fullName || profile.alias

export const cvFile = (locale: Locale) => `/cv/${profile.alias}-CV-${locale}.pdf`
