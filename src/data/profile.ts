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
  source?: string
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

export interface SkillGroup {
  group: L
  items: (string | L)[]
}

export const profile = {
  alias: 'noxx',
  fullName: '',
  handle: 'noxxUY',
  role: { en: 'Full Stack Developer', es: 'Desarrollador Full Stack' } satisfies L,
  roleLine: {
    en: 'I do frontend and backend on the web. I also like digging into how things work at a low level, with C, C++ and reverse engineering.',
    es: 'Hago frontend y backend web. También me gusta investigar cómo funcionan las cosas a bajo nivel, con C, C++ y reverse engineering.',
  } satisfies L,
  summary: {
    en: "Lately I've been making browser tools that open Minecraft worlds or GTA archives, showing them in 3D without uploading anything. I'm also building a co-op mod for GTA III.",
    es: 'Últimamente estoy haciendo herramientas web que abren mundos de Minecraft o archivos de GTA, mostrándolos en 3D sin subir nada. También estoy haciendo un mod cooperativo para GTA III.',
  } satisfies L,
  location: { en: 'Uruguay', es: 'Uruguay' } satisfies L,
  countryCode: 'UY',
  timezone: 'UTC−3',
  availability: { en: 'Open to remote work', es: 'Disponible para trabajo remoto' } satisfies L,
  email: 'noxxzeraa@proton.me',
  links: {
    github: 'https://github.com/noxxUY',
    linkedin: '',
    site: 'https://noxxuy.github.io',
    siteSource: 'https://github.com/noxxUY/noxxUY.github.io',
  },
  // Shown until the GitHub fetch answers, and whenever it fails. Keep it evergreen: the
  // live line names the repo of your last push, this one has to stay true on any day.

  projects: [
    {
      id: 'coopiii',
      name: 'CoopIII',
      date: { en: 'Since Sep 2026', es: 'Desde sep 2026' },
      tagline: {
        en: 'Cooperative story mode multiplayer for GTA III.',
        es: 'Multijugador cooperativo del modo historia de GTA III.',
      },
      description: {
        en: 'Up to 8 players share one Liberty City and play the story together. One player starts a mission and everyone plays it with them. It hooks the retail gta3.exe directly instead of shipping a modified binary.',
        es: 'Hasta 8 jugadores comparten la misma Liberty City y juegan la historia juntos. Uno arranca una misión y todos la juegan con él. Se engancha directo al gta3.exe original en lugar de distribuir un ejecutable modificado.',
      },
      highlights: [
        {
          en: 'Syncs players, vehicles, combat, traffic, police, the clock, the weather, pickups and garages.',
          es: 'Sincroniza jugadores, vehículos, combate, tráfico, policía, la hora, el clima, los pickups y los garajes.',
        },
        {
          en: 'Written from scratch against the original binary, reverse engineered with IDA Pro.',
          es: 'Escrito desde cero sobre el ejecutable original, con reverse engineering en IDA Pro.',
        },
      ],
      formats: [],
      stack: ['C++', 'xmake', 'IDA Pro'],
      live: 'https://coopiii.com',
      source: 'https://github.com/noxxUY/CoopIII',
      image: 'coopiii.png',
      imageAlt: {
        en: 'Two players in the same street of Liberty City, each one with a nametag over the other.',
        es: 'Dos jugadores en la misma calle de Liberty City, cada uno con el nombre del otro encima.',
      },
    },
    {
      id: 'minevisor',
      name: 'Minevisor',
      date: { en: 'Since Aug 2026', es: 'Desde ago 2026' },
      tagline: {
        en: 'Minecraft Java worlds in the browser, in 3D.',
        es: 'Mundos de Minecraft Java en el navegador, en 3D.',
      },
      description: {
        en: 'Open a save folder and fly through the world in 3D, check the map, players, inventories, chunks and NBT. It can also move a player\'s inventory to another account. Everything is decoded on your machine, nothing gets uploaded.',
        es: 'Abrís la carpeta de una partida y recorrés el mundo en 3D, con el mapa, los jugadores, los inventarios, los chunks y el NBT. También puede pasar el inventario de un jugador a otra cuenta. Todo se decodifica en tu máquina, no se sube nada.',
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
      ],
      formats: ['.mca', '.dat', 'NBT'],
      stack: ['TypeScript', 'Astro', 'React', 'Three.js', 'Tailwind CSS'],
      live: 'https://minevisor.cc',
      image: 'minevisor.webp',
      imageAlt: {
        en: 'Minevisor open on the demo world, with the 3D viewer over a village and the players and waypoints beside it.',
        es: 'Minevisor abierto con el mundo de prueba, el visor 3D sobre una aldea y los jugadores y waypoints al costado.',
      },
    },
    {
      id: 'minevisor-live',
      name: 'Minevisor Live',
      date: { en: 'Oct 2026', es: 'oct 2026' },
      tagline: {
        en: 'A server plugin that streams a Minecraft server into Minevisor in real time.',
        es: 'Un plugin de servidor que transmite un server de Minecraft a Minevisor en tiempo real.',
      },
      description: {
        en: 'A plugin for Paper and Spigot, and a mod for Fabric. It runs a small web server inside the Minecraft server, so the browser connects straight to it with no backend in between. Players moving, blocks changing and inventories show up as they happen, and it can post to Discord.',
        es: 'Un plugin para Paper y Spigot, y un mod para Fabric. Levanta un pequeño servidor web adentro del server de Minecraft, así el navegador se conecta directo sin ningún backend en el medio. Los jugadores moviéndose, los bloques que cambian y los inventarios aparecen en el momento, y puede publicar en Discord.',
      },
      highlights: [
        {
          en: 'One link per server, revocable, with the world seed never sent to viewers.',
          es: 'Un link por server que se puede revocar, y la semilla del mundo nunca llega a quien mira.',
        },
        {
          en: 'Discord announcements and a live status message, configured from in-game commands.',
          es: 'Anuncios en Discord y un mensaje de estado en vivo, configurados con comandos dentro del juego.',
        },
      ],
      formats: [],
      stack: ['Java', 'Paper', 'Fabric', 'TypeScript'],
      live: 'https://minevisor.cc/#live',
      source: 'https://github.com/noxxUY/minevisor-live',
      image: 'minevisor-live.png',
      imageAlt: {
        en: 'The /minevisor link command and a live feed of server events.',
        es: 'El comando /minevisor link y un feed en vivo de los eventos del server.',
      },
    },
    {
      id: 'img-editor',
      name: 'IMG Editor',
      date: { en: 'Since Sep 2026', es: 'Desde sep 2026' },
      tagline: {
        en: 'Browser-based IMG archive editor for GTA III, Vice City and San Andreas.',
        es: 'Editor de archivos IMG de GTA III, Vice City y San Andreas, en el navegador.',
      },
      description: {
        en: 'Opens the game archives and lets you browse, extract, replace, add, delete and rebuild entries, with a 3D preview of every DFF model and TXD texture. Saves in place through the File System Access API. Nothing leaves your machine.',
        es: 'Abre los archivos del juego y permite explorar, extraer, reemplazar, agregar, borrar y reconstruir entradas, con vista previa 3D de cada modelo DFF y cada textura TXD. Guarda los cambios sobre el mismo archivo con la File System Access API. Nada sale de tu máquina.',
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
      image: 'img-editor.webp',
      imageAlt: {
        en: "IMG Editor with San Andreas' gta3.img open and Cesar Vialpando rendered with his textures in the 3D viewer.",
        es: "IMG Editor con el gta3.img de San Andreas abierto y Cesar Vialpando con sus texturas en el visor 3D.",
      },
    },
    {
      id: 'remotepsp',
      name: 'RemotePSP',
      date: { en: 'Sep 2026', es: 'sep 2026' },
      tagline: {
        en: "Streams a PSP's screen to a PC over Wi-Fi.",
        es: 'Transmite la pantalla de una PSP a la PC por Wi-Fi.',
      },
      description: {
        en: 'A plugin running on the PSP captures the screen, compresses it and sends it over UDP, both in the menu and inside games. A small receiver on the PC shows it in a window you can capture with OBS.',
        es: 'Un plugin que corre en la PSP captura la pantalla, la comprime y la manda por UDP, tanto en el menú como adentro de los juegos. Un receptor en la PC la muestra en una ventana que podés capturar con OBS.',
      },
      highlights: [
        {
          en: 'Lost packets are recovered over the PSP\'s weak 802.11b Wi-Fi.',
          es: 'Recupera los paquetes perdidos en el Wi-Fi 802.11b de la PSP, que es muy flojo.',
        },
      ],
      formats: [],
      stack: ['C', 'PSP SDK', 'Python'],
      source: 'https://github.com/noxxUY/RemotePSP',
      image: 'remotepsp.png',
      imageAlt: {
        en: 'The RemotePSP window on Windows showing the PSP menu.',
        es: 'La ventana de RemotePSP en Windows mostrando el menú de la PSP.',
      },
    },
  ] satisfies Project[],

  openSource: [] as Contribution[],


  skills: [
    {
      group: { en: 'Languages', es: 'Lenguajes' },
      items: ['TypeScript', 'JavaScript', 'Python', 'C', 'C++', 'HTML', 'CSS'],
    },
    {
      group: { en: 'Web', es: 'Web' },
      items: ['React', 'Astro', 'Node.js', 'Vite', 'Tailwind CSS', 'Three.js', 'WebGL'],
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
        { en: 'Game modding in C++ (GTA III, San Andreas)', es: 'Modding de juegos en C++ (GTA III, San Andreas)' },
      ],
    },
  ] satisfies SkillGroup[],
}

export const skillText = (item: string | L): L => (typeof item === 'string' ? { en: item, es: item } : item)

export const displayName = profile.fullName || profile.alias

export const cvFile = (locale: Locale) => `/cv/${profile.alias}-CV-${locale}.pdf`
