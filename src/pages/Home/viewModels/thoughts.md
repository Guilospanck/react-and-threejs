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

Using this information, we could have the following object containing data about which are of the real map belongs to which owner (and
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
  xCoord: number, // x coordinate of the center of the square (in real map units)
  zCoord: number, // z coordinate of the center of the square (in real map units)
}

type Property = {
  owner: String,
  lands: Land[]
}

const map: Property[] = [
  {
    owner: "User_1",
    lands: [
      { x: 50, y: 50 },
      { x: 60, y: 60 },
      { x: 70, y: 70 },
      { x: 80, y: 80 },
    ]
  },
  {
    owner: "User_2",
    lands: [
      { x: 150, y: 150 },
      { x: 160, y: 160 },
      { x: 170, y: 170 },
      { x: 180, y: 180 },
    ]
  },
  {
    owner: "User_3",
    lands: [
      { x: 250, y: 250 },
      { x: 260, y: 260 },
      { x: 270, y: 270 },
      { x: 280, y: 280 },
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
const mapRealUnitsToGameUnits = (land: Land): (x: number, y: number) => {
  let xGameUnits, zGameUnits = land.x - FIRST_X_HALF, land.z - FIRST_Z_HALF 

  xGameUnits /= MULTIPLYING_FACTOR_X
  zGameUnits /= MULTIPLYING_FACTOR_Z

  return (xGameUnits, zGameUnits)  
}

```