
export interface HeroModel {
  file: string
  game: string
  version: string
  bytes: number
  yaw?: number
}

export const heroModels: HeroModel[] = [
  { file: 'm01.dff', game: 'GTA III', yaw: 180, version: '3.2.0.0', bytes: 106496 },
  { file: 'm02.dff', game: 'GTA III', yaw: 180, version: '3.2.0.0', bytes: 108544 },
  { file: 'm03.dff', game: 'GTA III', yaw: 180, version: '3.2.0.0', bytes: 73728 },
  { file: 'm04.dff', game: 'GTA III', yaw: 180, version: '3.2.0.0', bytes: 86016 },
  { file: 'm05.dff', game: 'Vice City', version: '3.4.0.3', bytes: 71680 },
  { file: 'm06.dff', game: 'Vice City', version: '3.3.0.2', bytes: 79872 },
  { file: 'm07.dff', game: 'Vice City', version: '3.3.0.2', bytes: 88064 },
  { file: 'm08.dff', game: 'Vice City', version: '3.3.0.2', bytes: 94208 },
]

export interface HeroPlayer {
  name: string
  skin: string
  cape?: string
  slim: boolean
}

// Skins are saved into public/skins/ instead of fetched from Mojang at runtime, so
// the hero never depends on a third party being up.
export const heroPlayers: HeroPlayer[] = [
  { name: 'ndjq', skin: 'ndjq.png', cape: 'ndjq-cape.png', slim: true },
  { name: 'ktrssj', skin: 'ktrssj.png', cape: 'ktrssj-cape.png', slim: false },
  { name: 'parrinha9', skin: 'parrinha9.png', slim: false },
  { name: 'Caco22_', skin: 'Caco22_.png', cape: 'Caco22_-cape.png', slim: false },
  { name: 'Braianwow', skin: 'Braianwow.png', slim: false },
]
