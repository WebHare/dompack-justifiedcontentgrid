import * as dompack from "dompack";


export class JustifiedContentGrid
{
  constructor(container, options)
  {
    this.container = null;
    this.gridcontainer = null;
    this.items = [];

    // vars for auto update in case image dimensions have to be determines and updated on the fly
    this.newinforefreshtimer = null;
    this.waitingforimagecount = 0;

    this.options =
      { width:              0
      , height:             0
      //, direction:          "horizontal" // FIXME: not implemented

      , row_height:         256 // used for direction: "horizontal"
      , column_width:       256 // used for direction: "vertical"


      // the amount of rows(if direction="horizontal") or columns if direction="vertical"
      // if set and the track's size is fixed, any images which do not fit in the specified amount of tracks won't be shown
      //, tracks:             4 // FIXME: not implemented

      // "keep" - keep original ordering
      // "bestfit" - order in such a way as to get equal sized tracks
      //, ordering:           "keep" // FIXME: not implemented

      // gutter size
      , gutter_x:           2
      , gutter_y:           2

      , debug:              false

      , fill_last_strip_threshold: 40
      };

    //this.setOptions(options);
    this.options = {...this.options, ...options};

    //this.gridcontainer = new Element("div", { styles: { position: "relative" } });
    this.gridcontainer = document.createElement("div");
    this.gridcontainer.style.position = "relative";

    if (typeof this.container == "string")
      this.container = document.querySelector(container);
    else// if node
      this.container = container;
  }

  setOptions(options)
  {
    Object.assign(this.options, options);
  }

  /** @short relayout
  */
  refresh()
  {
    this.refreshHorizontal();
    /*
    switch(this.options.direction)
    {
      case "horizontal":
        this.refreshHorizontal();
        break;

      case "vertical":
        this.refreshVertical();
        break;
    }
    */
  }

  refreshHorizontal()
  {
    var strip_width = this.options.width; // container width
    var strip_height = this.options.row_height;

    if (strip_width == 0)
    {
      strip_width = this.container.clientWidth;

      if (strip_width == 0)
      {
        console.warn("Cannot draw, the clientWidth of the specified container is 0 (display: none; ?).");
        return;
      }
    }

    var img_idx = 0;
    var img_count = this.items.length;

    var current_width = 0
      , current_width_next = 0
      , row = 0
      , ypos = 0;

    if (this.options.debug)
    {
      console.log(img_count, "images");
      console.log("strip_width:", strip_width);
      //console.log(this.items);
    }

    var maxiterations = 999;
    var maxrows = 80;
    while(img_idx < img_count && row < maxrows && maxiterations > 0)
    {
      maxiterations--;

      var column = 0;
      var current_width = 0;
      var current_width_next = 0;

      if (row > 0)
        ypos += this.options.gutter_y;

      // determine how many items can fit
      var img_this_strip = [];
      var item = null;
      while(img_idx < img_count && current_width_next < strip_width)
      {
        item = this.items[img_idx];

        // determine width we need to get the height to exactly fit
        var resized_width = Math.ceil(item.width * (strip_height / item.height));
        item.width_apply = resized_width;

        /*
        console.log({ width:   item.width
                    , height:  item.height
                    , width_r: item.width_apply
                    });
        */

        current_width_next += item.width_apply + (column == 0 ? 0 : this.options.gutter_x);

        if (current_width_next < strip_width)
        {
          current_width = current_width_next;
          img_this_strip.push(item);
          img_idx++;
        }

        column++;
      }
      column--;

      //console.info("img_this_strip", img_this_strip);

      // the total amount of pixels to add or substract from images in this strip
      var compensatex = 0;

      // Determine what strategy would be the best for getting content
      // nicely justified (with the less amount of stretching or shrinking)
      // (unless we fit exactly)
      if (current_width != strip_width)
      {
        var grow_if_no_extra_image = strip_width - current_width; // how many pixels do items have to grow to fit?
        var shrink_if_extra_image = current_width_next - strip_width; // if we add one extra image (and overflow), how many pixels do items have to shrink to fit?

        //console.log(img_idx, img_count);
        //console.log(row);

        if (img_this_strip.length == 0) // single wide (panoramic) image
        {
          img_this_strip.push(item);
          column++; // (for debugging or if we want to store the column and row in the array)

          // Scale the image to fill the width & height of this strip
          var scale_to_fill_width  = strip_width  / item.width;
          var scale_to_fill_height = strip_height / item.height;
          var scale_to_fill_both   = scale_to_fill_width > scale_to_fill_height ? scale_to_fill_width : scale_to_fill_height;

          // For blowing up the items a little we center on the middle and
          var result_width = Math.ceil(item.width * scale_to_fill_both);
          var result_height = Math.ceil(item.height * scale_to_fill_both);

          item.width_apply = result_width;

          /*
          console.log({ scale_w: scale_to_fill_width
                      , scale_h: scale_to_fill_height
                      , scale_final: scale_to_fill_both
                      , result_width: result_width
                      , result_height: result_height
                      });
          */

          item.node_applied = { left:   0
                              , top:    ypos
                              , width:  strip_width
                              , height: strip_height
                              };

          // update the clipping node
          item.node.style.left   = "0";
          item.node.style.top    = ypos+"px";
          item.node.style.width  = strip_width+"px";
          item.node.style.height = strip_height+"px";

          // FIXME: positioning can happen in non-rounded pixels...
          //        prevent this by increasing the scale_to_fill_both a tiny bit so we can Math.floor ?

          item.img_applied =  { left:  (strip_width - result_width) / 2
                              , top:   (strip_height - result_height) / 2
                              , width: item.width_apply
                              };

          // update the image
          item.img.style.width = item.width_apply+"px";
          item.img.style.left = item.img_applied.left + "px";
          item.img.style.top = item.img_applied.top + "px";

          column++; // (for debugging or if we want to store the column and row in the array)
          img_idx++;

          row++;
          ypos += strip_height;

          if (this.options.debug)
            console.log(img_idx, "will fill it's own row (panoramic)");

          continue;
        }
        if (img_idx == img_count && this.options.fill_last_strip_threshold < grow_if_no_extra_image)
        {
          img_this_strip.push(item);
          column++; // (for debugging or if we want to store the column and row in the array)

          if (this.options.debug)
            console.log(img_idx, "last image but no need to grow (fill_last_strip_threshold lower than empty space");
        }
        else if (grow_if_no_extra_image < shrink_if_extra_image)
        {
          // 1. grow the items which fit to fill up all space
          compensatex = grow_if_no_extra_image;

          if (this.options.debug)
            console.log(img_idx, "will distribute", compensatex, "to items in row");
        }
        else // also get the current image into this column
        {
          // 2. shrink the items to fit
          compensatex = -shrink_if_extra_image;
          img_this_strip.push(item);

          if (this.options.debug)
            console.log(img_idx, "will shrink", compensatex, "to make a last image fit in the row");

          column++; // (for debugging or if we want to store the column and row in the array)
          img_idx++;
        }
      }

      if (this.options.debug)
        console.info("Row #"+row+" contains ", img_this_strip.length, "images");


      // if (compensatex != 0)
      var add_each_item = Math.floor(compensatex / column);
      var add_last_item = compensatex - add_each_item * column;

      if (this.options.debug)
      {
        console.info("We need to grow"); //, distributing", compensatex, " over", column, "columns.");
        console.info(
            { compensatex:   compensatex
            , columns:       column
            , add_each_item: add_each_item
            , add_last_item: add_last_item
            });
      }

      var xpos = 0;
      for (var col_idx = 0; col_idx < column; col_idx++)
      {
        //console.log(col_idx);
        var item = img_this_strip[col_idx];

        item.width_apply_orig = item.width_apply;

        // apply extra pixels
        if (compensatex != 0)
        {
          item.width_apply += add_each_item;
          if (col_idx == column - 1)
            item.width_apply += add_last_item;
        }

        // styles for the container/cropping node
        item.node_applied = { left: xpos
                            , top:  ypos
                            , width: item.width_apply
                            , height: strip_height
                            };

        if (compensatex > 0)
        {
          // For blowing up the items a little we center on the middle and
          // cut off a little at the top and bottom
          var expected_height = item.height * (item.width_apply / item.width);
          /*
          console.log({ img: item.img
                      , width: item.width
                      , width_scaled: item.width_apply_orig
                      , width_scaled_justified: item.width_apply
                      , expected_height: item.expected_height
                      , left: 0
                      , top:  (strip_height - expected_height) / 2
                      });
          */

          item.img_applied =  { left: 0
                              , top:  Math.round((strip_height - expected_height) / 2)
                              , width: item.width_apply
                              };
        }
        else if (compensatex < 0) // < 0, because == 0 is already handled
        {
          // Shrinking items has to be done by cutting off pixels at the sides
          // (because we resize to exactly fit in the height, so if we zoom out whe'll have empty border)

          item.img_applied =  { left: Math.round((item.width_apply - item.width_apply_orig) / 2)
                              , top:  0
                              , width: item.width_apply_orig
                              };

        }
        else if (compensatex == 0)
        {
          item.img_applied =  { left:  0
                              , top:   0
                              , width: item.width_apply_orig
                              };
        }

        // update the container/clipping node
        item.node.style.left   = item.node_applied.left+"px";
        item.node.style.top    = item.node_applied.top+"px";
        item.node.style.width  = item.node_applied.width+"px";
        item.node.style.height = item.node_applied.height+"px";

        // update the image
        item.img.style.left    = item.img_applied.left+"px";
        item.img.style.top     = item.img_applied.top+"px";
        item.img.style.width   = item.img_applied.width+"px";

        xpos += item.width_apply + this.options.gutter_x;
      }

      /*
      if (item.node_applied)
        console.log(item.node_applied.width + "x" + item.node_applied.height + " at " + item.node_applied.left + "x" + item.node_applied.top);
      else
        console.log("no node_applied for item");
      */

      row++;
      ypos += strip_height;
    }

    this.gridcontainer.style.width = this.options.width+"px";
    this.gridcontainer.style.height = ypos+"px";
  }



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Private functions
//

  importItems(items)
  {
    var frag = document.createDocumentFragment();

    for (var tel=0; tel < items.length; tel++)
    {
      var item = items[tel];

      //var clip_node = new Element("div", { styles: { position: "absolute", overflow: "hidden" } });
      var clip_node = document.createElement("div");
      clip_node.style.cssText = "position: absolute; overflow: hidden;";
      clip_node.appendChild(item.contentnode);

      frag.appendChild(clip_node);

      item.node = clip_node;
    }

    this.gridcontainer.appendChild(frag);
  }
};


export class JustifiedImageGrid extends JustifiedContentGrid
{
  /** @short import images from the specified node
  */
  constructor(container, options)
  {
    super(container, options);

    //var images = container.getElements("IMG");
    var items = container.children;
    var imgcount = items.length;

    var new_items = [];

    for(var img_idx = 0; img_idx < imgcount; img_idx++)
    {
      // 1. preferred method is when the HTML author specified the dimensions
      var img = items[img_idx];
      //console.log("Importing ", img);

      var contentnode;
      // assume these are anchors/containers with the image inside them
      if (img.tagName != "IMG")
      {
        contentnode = img;
        //img = $(contentnode).getElement("img"); // $() needed for IE<9
        img = img.querySelector("img");
        if (!img)
        {
          console.warn("missing image node");
          continue;
        };
      }
      else
      {
        contentnode = img;
      };

      img.style.position = "absolute";

      var imgwidth = img.getAttribute("data-width");
      var imgheight = img.getAttribute("data-height");

      // 2. otherwise check whether the browsers already has access to at least the size of the image
      if (imgwidth === null)
        imgwidth = img.width;
      else
        imgwidth = parseInt(imgwidth);

      if (imgheight === null)
        imgheight = img.height;
      else
        imgheight = parseInt(imgheight);

      // remove width & height attributes so they won't interfere
      // FIXME: or should we always set our height in the inline styles?
      img.removeAttribute("width");
      img.removeAttribute("height");

      // store the known data on the image
      var imgdesc =
          { img:    img
          , contentnode: contentnode // the node to be imported in the clipping node
          , node:   null             // clipping node, to be set in the JustifiedContentGrid::importNode() function
          , width:  imgwidth
          , height: imgheight
          };
      new_items.push(imgdesc);

      // if no image dimensions available yet (image not loaded) resort to updating this info later
      if (imgwidth == 0 || imgheight == 0)
      {
        this.waitingforimagecount++;
        img.addEvent("load", this.__onImageLoad.bind(this, imgdesc));
      }
    };

    this.importItems(new_items);

    //this.items.append(new_items);
    this.items = this.items.concat(new_items);

    this.container.appendChild(this.gridcontainer);
  }

  /** @short add images by passiging an array with image information
      @param images
      @cell images.url
      @cell images.width
      @cell images.height
, addImages: function(images)
  {
    // ADDME: validate?

    // now append in a single operation
    this.items.append(images);
  }
  */

  __onImageLoad(item_ref, evt)
  {
    if (this.options.debug)
      console.log("Updating image size");

    var imgnode = evt.target;
    item_ref.width = imgnode.width;
    item_ref.height = imgnode.height;

    this.waitingforimagecount--;
    if (this.waitingforimagecount == 0)
    {
      // this was the last image we needed, we can cancel the timer and directly force an refresh
      clearTimeout(this.newinforefreshtimer);
      this.__forceRefresh();
    }
    else if (!this.newinforefreshtimer)
    {
      // update on a timer to make sure we don't update for every single image
      this.newinforefreshtimer = this.__forceRefresh.delay(250, this);
    }
  }
  __forceRefresh()
  {
    this.newinforefreshtimer = null;
    this.refresh();
  }
};
