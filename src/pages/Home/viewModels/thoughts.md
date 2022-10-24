Let's say we have a "real" map that has 2000 x 2000 meters of area.
Our current grid is divided into `${GRID_LENGTH}` equal pieces, therefore each grid will translate into 100 meters:

```
  ---------
  |       |
  | 100m2 | ... + 19
  |       |
  ---------
  |       |
  | 100m2 | ... + 19
  |       |
  ---------
  |       |
  | 100m2 | ... + 19
  |       |
  ---------
   ... +17
```

Using this information, we could have the following object containing data about which area of the real map belongs to which owner (and
also considering that all areas are square, meaning that no one owns a different piece of land other than one made solely of squared lands
and the minimum land to be bought is defined by the area of `${REAL_X_MAP_UNITS}/${GRID_LENGTH} x ${REAL_Z_MAP_UNITS}/${GRID_LENGTH}`, in real map units):

```ts
  /**
   *    0 - - - - x
   *    |
   *    |
   *    |
   *    z
  */

type Land = {  
  x: number, // x coordinate of the center of the square (in real map units)
  z: number, // z coordinate of the center of the square (in real map units)
}

type Property = {
  owner: String,
  lands: Land[]
}

const mapInfo: Property[] = [
  {
    owner: "User_1",
    lands: [
      { x: 50, z: 50 },
      { x: 150, z: 150 },
      { x: 250, z: 250 },
      { x: 350, z: 350 },
    ],
  },
  {
    owner: "User_2",
    lands: [
      { x: 450, z: 450 },
      { x: 550, z: 550 },
      { x: 650, z: 650 },
      { x: 750, z: 750 },
    ]
  },
  {
    owner: "User_3",
    lands: [
      { x: 850, z: 850 },
      { x: 950, z: 950 },
      { x: 1050, z: 1050 },
      { x: 1150, z: 1150 },
    ]
  },
]
```

Then we can convert it to `game units` using the following function:

```ts
const REAL_X_MAP_UNITS = 2000
const REAL_Z_MAP_UNITS = 2000
const GRID_LENGTH = 20
const MULTIPLYING_FACTOR_X = REAL_X_MAP_UNITS / GRID_LENGTH
const MULTIPLYING_FACTOR_Z = REAL_Z_MAP_UNITS / GRID_LENGTH
const FIRST_X_HALF = REAL_X_MAP_UNITS / 2
const FIRST_Z_HALF = REAL_Z_MAP_UNITS / 2

/*
  Converts from real map units to game units.
  One thing to observe is that the origin of the coordinates axes
  is at the center of the screen, therefore the units must also be translated.

             (-z)
              |
              |
              |        
 (-x) - - - - 0 - - - - (x)
              |
              |
              |
             (z)
*/
const mapRealUnitsToGameUnits = (land: Land): { xGameUnits: number, zGameUnits: number } => {
  let xGameUnits = land.x - FIRST_X_HALF
  let zGameUnits = land.z - FIRST_Z_HALF

  xGameUnits /= MULTIPLYING_FACTOR_X
  zGameUnits /= MULTIPLYING_FACTOR_Z

  return { xGameUnits, zGameUnits }
}

```