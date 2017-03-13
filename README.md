# What does it do

Popular names for this kind of effect:
- responsive gallery
- Google Plus inspired image gallery


# Usage

Instructions on usage:
- use box-sizing: border-box;
- specify data-width and data-height attributes to prevent relayout of the page / JustifiedMediaGrid
- DON'T use "fill" as resize method in the GetCachedImage functions, the JustifiedImageGrid must determine which parts can be cut off

import * as grid from "@webhare-blexdev_jslayout/layout.justifiedcontentgrid";

OR

import { JustifiedContentGrid } from "@webhare-blexdev_jslayout/layout.justifiedcontentgrid";

OR

import { JustifiedImageGrid } from "@webhare-blexdev_jslayout/layout.justifiedcontentgrid";



# Usage of JustifiedImageGrid

Initializing:

  var grid = new JustifiedImageGrid(gridnode, options);

Updating settings:
(for example upon a resize of the page)


    grid.setOptions(options);
    grid.refresh();



# Usage of JustifiedContentGrid

ADDME: documentation


# Future plans

- ability to scale arbitrary content (just transform: scale the nodes)

- FIXME: handle the case in which we get images which are too small  (we currently assume the images fill up our strip height)

- prevent zoom-in effect by always zooming in a little and cutting of a little if needed ?

- a server-side implementation? (would require the rows width and height to have a fixed aspect ratio)
