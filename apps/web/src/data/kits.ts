/**
 * Kit catalog for shirt markers, grouped into sets.
 *
 * Each entry is a flat front-view jersey SVG in `public/kits`, drawn on a
 * 512×512 canvas so swapping kits never shifts a marker. They are referenced by
 * URL rather than inlined because the files within a set reuse one clip-path id
 * — inlining them into a single document would collide.
 *
 * Ids are unique across every set, so a persisted `shirtKitId` resolves without
 * needing to record which set it came from.
 */
export interface Kit {
  /** Stable slug; this is what gets persisted in fieldSettings. */
  id: string;
  name: string;
  src: string;
}

export interface KitSet {
  id: string;
  name: string;
  kits: Kit[];
  /**
   * Display scale for this set's artwork, applied wherever a kit is drawn.
   *
   * The sets do not fill the 512 canvas equally — set 1's silhouette spans the
   * full width while set 2's spans 444 — so set 2 renders visibly smaller at
   * the same box size. Scaling it up evens them out. Defaults to 1.
   */
  scale?: number;
}

export const KIT_SETS: KitSet[] = [
  {
    id: "set-1",
    name: "Set 1",
    scale: 1.05,
    kits: [
    { id: "01-black-blue-pinstripes", name: "Black Blue Pinstripes", src: "/kits/01-black-blue-pinstripes.svg" },
    { id: "02-red-navy-centerstripe", name: "Red Navy Centerstripe", src: "/kits/02-red-navy-centerstripe.svg" },
    { id: "03-half-red-navy-white-sleeves", name: "Half Red Navy White Sleeves", src: "/kits/03-half-red-navy-white-sleeves.svg" },
    { id: "04-sky-blue", name: "Sky Blue", src: "/kits/04-sky-blue.svg" },
    { id: "05-purple-white-cuffs", name: "Purple White Cuffs", src: "/kits/05-purple-white-cuffs.svg" },
    { id: "06-half-navy-red", name: "Half Navy Red", src: "/kits/06-half-navy-red.svg" },
    { id: "07-royal-blue-yellow-cuffs", name: "Royal Blue Yellow Cuffs", src: "/kits/07-royal-blue-yellow-cuffs.svg" },
    { id: "08-blue-black-stripes", name: "Blue Black Stripes", src: "/kits/08-blue-black-stripes.svg" },
    { id: "09-black-white-stripes", name: "Black White Stripes", src: "/kits/09-black-white-stripes.svg" },
    { id: "10-light-blue-white-cuffs", name: "Light Blue White Cuffs", src: "/kits/10-light-blue-white-cuffs.svg" },
    { id: "11-red-black-stripes", name: "Red Black Stripes", src: "/kits/11-red-black-stripes.svg" },
    { id: "12-blue-navy-cuffs-red-bar", name: "Blue Navy Cuffs Red Bar", src: "/kits/12-blue-navy-cuffs-red-bar.svg" },
    { id: "13-crimson-orange-band", name: "Crimson Orange Band", src: "/kits/13-crimson-orange-band.svg" },
    { id: "14-maroon-tricolor-cuffs", name: "Maroon Tricolor Cuffs", src: "/kits/14-maroon-tricolor-cuffs.svg" },
    { id: "15-blue-tricolor-band", name: "Blue Tricolor Band", src: "/kits/15-blue-tricolor-band.svg" },
    { id: "16-white", name: "White", src: "/kits/16-white.svg" },
    { id: "17-green-black-pinstripes", name: "Green Black Pinstripes", src: "/kits/17-green-black-pinstripes.svg" },
    { id: "18-maroon-brown", name: "Maroon Brown", src: "/kits/18-maroon-brown.svg" },
    { id: "19-black-white-wide-stripes", name: "Black White Wide Stripes", src: "/kits/19-black-white-wide-stripes.svg" },
    { id: "20-orange-black-green-hoops", name: "Orange Black Green Hoops", src: "/kits/20-orange-black-green-hoops.svg" },
    { id: "21-black-red-stripes-black-sleeves", name: "Black Red Stripes Black Sleeves", src: "/kits/21-black-red-stripes-black-sleeves.svg" },
    { id: "22-red-white-sleeves", name: "Red White Sleeves", src: "/kits/22-red-white-sleeves.svg" },
    { id: "23-claret-skyblue-sleeves", name: "Claret Skyblue Sleeves", src: "/kits/23-claret-skyblue-sleeves.svg" },
    { id: "24-red-white-stripes-white-sleeves", name: "Red White Stripes White Sleeves", src: "/kits/24-red-white-stripes-white-sleeves.svg" },
    { id: "25-blue-white-striped-hem", name: "Blue White Striped Hem", src: "/kits/25-blue-white-striped-hem.svg" },
    { id: "26-claret-sky-cuffs", name: "Claret Sky Cuffs", src: "/kits/26-claret-sky-cuffs.svg" },
    { id: "27-royal-blue", name: "Royal Blue", src: "/kits/27-royal-blue.svg" },
    { id: "28-red-blue-stripes", name: "Red Blue Stripes", src: "/kits/28-red-blue-stripes.svg" },
    { id: "29-blue", name: "Blue", src: "/kits/29-blue.svg" },
    { id: "30-white-black-trim", name: "White Black Trim", src: "/kits/30-white-black-trim.svg" },
    { id: "31-white-navy-collar", name: "White Navy Collar", src: "/kits/31-white-navy-collar.svg" },
    { id: "32-red", name: "Red", src: "/kits/32-red.svg" },
    { id: "33-sky-blue-light", name: "Sky Blue Light", src: "/kits/33-sky-blue-light.svg" },
    { id: "34-bright-red", name: "Bright Red", src: "/kits/34-bright-red.svg" },
    { id: "35-white-black-sleeves-striped-hem", name: "White Black Sleeves Striped Hem", src: "/kits/35-white-black-sleeves-striped-hem.svg" },
    { id: "36-soft-red", name: "Soft Red", src: "/kits/36-soft-red.svg" },
    { id: "37-white-navy-trim", name: "White Navy Trim", src: "/kits/37-white-navy-trim.svg" },
    { id: "38-red-white-pinstripes", name: "Red White Pinstripes", src: "/kits/38-red-white-pinstripes.svg" },
    { id: "39-dark-claret", name: "Dark Claret", src: "/kits/39-dark-claret.svg" },
    { id: "40-amber-black", name: "Amber Black", src: "/kits/40-amber-black.svg" },
    ],
  },
  {
    id: "set-2",
    name: "Set 2",
    scale: 1.2,
    kits: [
    { id: "pl-01-red-white-sleeves", name: "Red White Sleeves", src: "/kits/pl-01-red-white-sleeves.svg" },
    { id: "pl-02-pale-cyan", name: "Pale Cyan", src: "/kits/pl-02-pale-cyan.svg" },
    { id: "pl-03-blue-navy-collar", name: "Blue Navy Collar", src: "/kits/pl-03-blue-navy-collar.svg" },
    { id: "pl-04-red-black-trim", name: "Red Black Trim", src: "/kits/pl-04-red-black-trim.svg" },
    { id: "pl-05-half-blue-red", name: "Half Blue Red", src: "/kits/pl-05-half-blue-red.svg" },
    { id: "pl-06-royal-blue-white-collar", name: "Royal Blue White Collar", src: "/kits/pl-06-royal-blue-white-collar.svg" },
    { id: "pl-07-burnt-orange", name: "Burnt Orange", src: "/kits/pl-07-burnt-orange.svg" },
    { id: "pl-08-white-black-sleeves", name: "White Black Sleeves", src: "/kits/pl-08-white-black-sleeves.svg" },
    { id: "pl-09-claret-sky-sleeves", name: "Claret Sky Sleeves", src: "/kits/pl-09-claret-sky-sleeves.svg" },
    { id: "pl-10-white-blue-striped-hem", name: "White Blue Striped Hem", src: "/kits/pl-10-white-blue-striped-hem.svg" },
    { id: "pl-11-claret-sky-hem", name: "Claret Sky Hem", src: "/kits/pl-11-claret-sky-hem.svg" },
    { id: "pl-12-black-red-stripes", name: "Black Red Stripes", src: "/kits/pl-12-black-red-stripes.svg" },
    { id: "pl-13-red-white-shoulders", name: "Red White Shoulders", src: "/kits/pl-13-red-white-shoulders.svg" },
    { id: "pl-14-black-white-stripes", name: "Black White Stripes", src: "/kits/pl-14-black-white-stripes.svg" },
    { id: "pl-15-red-white-stripes", name: "Red White Stripes", src: "/kits/pl-15-red-white-stripes.svg" },
    { id: "pl-16-deep-red", name: "Deep Red", src: "/kits/pl-16-deep-red.svg" },
    { id: "pl-17-striped-black-fade", name: "Striped Black Fade", src: "/kits/pl-17-striped-black-fade.svg" },
    { id: "pl-18-gold", name: "Gold", src: "/kits/pl-18-gold.svg" },
    { id: "pl-19-claret-blue-sleeves", name: "Claret Blue Sleeves", src: "/kits/pl-19-claret-blue-sleeves.svg" },
    { id: "pl-20-white-navy-trim", name: "White Navy Trim", src: "/kits/pl-20-white-navy-trim.svg" },
    { id: "pl-21-white-pink-shoulder-stripes", name: "White Pink Shoulder Stripes", src: "/kits/pl-21-white-pink-shoulder-stripes.svg" },
    { id: "pl-22-blue-red-multistripes", name: "Blue Red Multistripes", src: "/kits/pl-22-blue-red-multistripes.svg" },
    { id: "pl-23-blue-red-center-panel", name: "Blue Red Center Panel", src: "/kits/pl-23-blue-red-center-panel.svg" },
    { id: "pl-24-red-tonal-stripes-gold-trim", name: "Red Tonal Stripes Gold Trim", src: "/kits/pl-24-red-tonal-stripes-gold-trim.svg" },
    ],
  },
];

/** Every kit across every set, in set order. */
export const KITS: Kit[] = KIT_SETS.flatMap((s) => s.kits);

export const DEFAULT_KIT_ID = KITS[0].id;

export function getKitSrc(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return KITS.find((k) => k.id === id)?.src;
}

/** Display scale for the set holding this kit; 1 when the id is unknown. */
export function getKitScale(id: string | undefined): number {
  if (!id) return 1;
  return KIT_SETS.find((s) => s.kits.some((k) => k.id === id))?.scale ?? 1;
}

/** Index of the set holding this kit, or 0 when the id is unknown. */
export function getKitSetIndex(id: string | undefined): number {
  if (!id) return 0;
  const i = KIT_SETS.findIndex((s) => s.kits.some((k) => k.id === id));
  return i === -1 ? 0 : i;
}
