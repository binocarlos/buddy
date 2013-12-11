// this is the stub

var $ = require('jquery');
var Hammer = require('hammer');
var PageTurner = require('pageturner');

/*

 
  PUBLIC:

    animate_direction: -1|1

*/
module.exports = function (options){

 
  /*
  
    SETTINGS
    
  */
  var book_selector = options.selector || '#buddy';
  var page_selector = options.page_selector || '.page';
  var touch_selector = options.touch_selector || book_selector;
  var apply_pageclass = options.apply_pageclass || 'bookpage';
  var edgewidth = options.edgewidth || 10;
  var perspective = options.perspective || 950;
  var is_3d = typeof(options.is_3d)==='boolean' ? options.is_3d : true;
  var startpage = options.test_page || 0;
  var shadow = options.shadow;


  var currentindex = -1;
  var shadowloaded = false;
  var rendered = false;

  var active = false;


  /*
  
    STATE
    
  */
  var dragging = null;
  var animating = false;
  var loading = false;
  var currentsize = {};
  var currentpos = {};

  /*
  
    ELEM
    
  */
  var bookelem = $(book_selector);
  var touchelem = $(touch_selector);
  var shadowelem = $('<div class="buddy-shadow"></div>');

  if(shadow){
    shadowelem.insertAfter(bookelem);
  }

  var pagecount = $(book_selector).find(page_selector).length;

  // then create the pageturner
  var book = new PageTurner({
    has3d:is_3d,
    bookselector:book_selector,
    pageselector:page_selector,
    apply_pageclass:apply_pageclass,
    startpage:startpage,
    edgewidth:edgewidth,
    perspective:perspective
  })

  book.pagecount = pagecount;

  function get_current_page(){
    return book.currentpage || startpage;
  }

  function shadow_offset(forpage){
    return (forpage==0 ? 1 : 0) * (currentsize.width/2);
  }

  function shadow_width(forpage){
    if(forpage==0 || forpage==pagecount-1){
      return currentsize.width/2 + (forpage==pagecount-1 ? (currentsize.width*0.025) : 0);
    }
    else{
      return currentsize.width;
    }
  }

  function apply_shadow(forpage){
    var bookposition = bookelem.offset();
    shadowelem.css({
      'margin-left':shadow_offset(forpage),
      'left':bookposition.left + 'px',
      'top':bookposition.top + 'px'
    }).width(shadow_width(forpage)).height(bookelem.height())
  }

  /*
  
    SIZING
    
  */
  var shadowtimeout = null;

  $(window).on('resize', function(){

    apply_shadow(get_current_page());

  })

  /*
  
    LOGIC EVENTS
    
  */
  book.on('resize', function(newsize){
    
    apply_shadow(get_current_page());

  })

  book.on('canceldrag', function(index){
    dragging = true;
    book.active = true;
  })

  book.on('loaded', function(index){

    loading = false;
    
    if(book.triggernext){
      book.triggernext();
      book.triggernext = null;
    }
    else if(index!=currentindex){
      book.emit('view:page', index);
      dragging = true;
      book.active = true;
    }

    currentindex = index;
  })

  book.on('animate', function(side){

    animating = true;
  })

  book.on('animated', function(side){

    animating = false;
  })


  book.on('ready', function(){
    
  })

  book.on('load', function(index){
    loading = true;
  })

  book.on('view:page', function(index){

  })

  /*
  
    TOUCH EVENTS
    
  */
  var hammertime = new Hammer($(touch_selector).get(0), {
    drag_min_distance:10,
    tap_max_distance:9
  })

  hammertime.ondragstart = function(ev){
    dragging = true;
  }

  hammertime.ondrag = function(ev){
    if(!dragging){
      return;
    }

    if(ev.distance>=15){

      dragging = false;

      var direction = ev.direction=='left' ? 1 : -1;

      var nextpage = book.currentpage + direction;

      if(nextpage<0){
        return;
      }
      else if(nextpage>=book.page_html.length){
        return;
      }
      
      if(animating || loading){
        book.triggernext = function(){
          book.emit('drag', ev.direction);
          book.animate_direction(direction);
        }
      }
      else{
        book.emit('drag', ev.direction);
        book.animate_direction(direction);  

      }
    }
  }

  hammertime.ondragend = function(ev){
    dragging = false;
  }

  hammertime.ontap = function(ev){

    var elem = $(ev.originalEvent.srcElement);
    var bookelem = $(elem).closest('#book');

    if(bookelem.length<=0){
      return;
    }

    var evpos = {
      x:ev.touches[0].x,
      y:ev.touches[0].y
    }

    book.emit('touch', evpos, elem);
  }

  hammertime.onswipe = function(ev){

    book.emit('swipe', ev);

  }

  book.render();

  return book;
}