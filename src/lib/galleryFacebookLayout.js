/** Facebook-style album preview — gapless collage with varied tile sizes. */

export const FB_ALBUM_VIEW_MORE_THRESHOLD = 3
export const FB_ALBUM_PREVIEW_COUNT = 3

export function facebookHiddenCount(total) {
  if (total <= FB_ALBUM_VIEW_MORE_THRESHOLD) return 0
  return total - FB_ALBUM_PREVIEW_COUNT
}

export function facebookShowsMoreTile(total) {
  return total > FB_ALBUM_VIEW_MORE_THRESHOLD
}

export function facebookCollageLayout(total) {
  const layout = total > FB_ALBUM_VIEW_MORE_THRESHOLD ? 5 : Math.max(1, Math.min(5, total))

  switch (layout) {
    case 1:
      return {
        gridClass: 'grid-cols-1 grid-rows-1',
        tiles: [{ className: 'col-span-1 row-span-1' }],
      }
    case 2:
      return {
        gridClass: 'grid-cols-5 grid-rows-2',
        tiles: [
          { className: 'col-span-3 row-span-2' },
          { className: 'col-span-2 row-span-2' },
        ],
      }
    case 3:
      return {
        gridClass: 'grid-cols-4 grid-rows-2',
        tiles: [
          { className: 'col-span-2 row-span-2' },
          { className: 'col-span-2 row-span-1' },
          { className: 'col-span-2 row-span-1' },
        ],
      }
    case 4:
      return {
        gridClass: 'grid-cols-6 grid-rows-3',
        tiles: [
          { className: 'col-span-4 row-span-3' },
          { className: 'col-span-2 row-span-1' },
          { className: 'col-span-1 row-span-2' },
          { className: 'col-span-1 row-span-2' },
        ],
      }
    case 5:
    default:
      return {
        gridClass: 'grid-cols-4 grid-rows-3',
        tiles: [
          { className: 'col-span-2 row-span-3' },
          { className: 'col-span-2 row-span-1' },
          { className: 'col-span-1 row-span-1' },
          { className: 'col-span-1 row-span-1' },
          { className: 'col-span-2 row-span-1' },
        ],
      }
  }
}
