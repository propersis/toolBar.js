//////////////////////////////////////////////////////////
// toolBar v2 JQUERY PLUGIN      (2020-02-27)
// USAGE:  $(divSelector).toolBar(options);
// DEPENDENCIES: jQuery
// (C) 2018-2020 COPYRIGHT ORLANDO CALABRESE
// divSelector: Any element that can contain html
// options:{init:function(),destroy:boolean}
//////////////////////////////////////////////////////////
(function($) {
  "use strict";
  $.fn.toolBar = function(tbOptions) {
    // DEFAULT OPTIONS
    tbOptions = $.extend({
      init:function(mainSpec) {},
      destroy:false
    }, tbOptions);

    let $barConts = $(this);
    let toolTipTimeoutVar;

    ////////////////////////////////////////////////
    // ITEM MOUSE ENTER/LEAVE STANDARD FUNCTIONS
    ////////////////////////////////////////////////
    const tb_onMouseEnter = function(item, mouseEvent) {
      let $barCont = $(`#${item.id}`).closest('.tb-container');
      let html = item.tipHtml();
      if (tbOptions.debugMode) {
        let group = item.parentGroup;
        let bar = group.parentBar;
        html += `<hr />` +
          `<div>${bar.type} ${bar.name} ${bar.id}</div>` +
          `<div>${group.type} ${group.name} ${group.id}</div>` +
          `<div>${item.type} ${item.name} ${item.id}</div>`;
      }
      if (html) {
        let $toolTip = $barCont.find('.tb-tooltip').first();
        $toolTip.html(html);
        $toolTip.removeClass('tb-tooltip-right');
        let posX = mouseEvent.pageX - $barCont.offset().left;
        if ((posX + $toolTip.width()) > $barCont.width()) {
          $toolTip.addClass('tb-tooltip-right');
          posX = mouseEvent.pageX - $toolTip.width();
        }
        let posY = mouseEvent.pageY - $barCont.offset().top + 32;
        $toolTip.css('left', posX + 'px');
        $toolTip.css('top', posY + 'px');
        if (!item.active) $toolTip.addClass('tb-tooltip-dimm');
        toolTipTimeoutVar = setTimeout (function() {
          $toolTip.show();
        },1500);
      }
    }

    const tb_onMouseLeave = function(item) {
      clearTimeout(toolTipTimeoutVar);
      let $barCont = $(`#${item.id}`).closest('.tb-container');
      let $toolTip = $barCont.find('.tb-tooltip').first();
      $toolTip.removeClass('tb-item-tooltip-dimm');
      $toolTip.html('').hide();
    }

    ////////////////////////////////////////////////
    // BAR, GROUP AND ITEM RENDER FUNCTIONS
    ////////////////////////////////////////////////
    const tb_SpecRender = function(specHtml) {
      return `<div class="tb-container">` +
        `<div class="tb-bars">${specHtml}</div>` +
        `<div class="tb-tooltip"></div>` +
        `</div>`;
    }

    const tb_BarRender = function(bar, barIndex, html) {
      let dClass = bar.active()?'':' tb-disabled';  
      let hClass = bar.display()?'':' tb-hidden';
      let s = `<div id="${bar.id}" class="tb-bar${dClass}${hClass}" tb-index="${barIndex}" tb-name="${bar.name}">${html}</div>`;
      return s;
    }

    const tb_GroupRender = function(group, groupIndex, html) {
      let dClass = group.active()?'':' tb-disabled';  
      let hClass = group.display()?'':' tb-hidden';
      let rClass = group.right?' tb-group-right':'';
      let s = `<span id="${group.id}" class="tb-group${dClass}${hClass}${rClass}" tb-index="${groupIndex}" tb-name="${group.name}">${html}</span>`;
      return s;
    }

    const tb_ItemRender = function(item, itemIndex) {
      let dClass = item.active()?'':' tb-disabled';  
      let hClass = item.display()?'':' tb-hidden';  
      let s = `<span id="${item.id}" class="tb-item${dClass}${hClass}" tb-index="${itemIndex}" tb-name="${item.name}">`;
      if (item.anchor()) {
        s += `<a href="#" title="${item.title()}">${item.html()}</a>`;
      } else {
        s += item.html();
      }
      s += `</span>`;
      return s;
    }

    ////////////////////////////////////////////////
    // DOM ELEM OPERATIONS
    ////////////////////////////////////////////////
    const tb_ElemDisplay = function(elem, d) {
      if (elem.id) {
        if (d) {
          $(`#${elem.id}`).removeClass('tb-hidden');
        } else {
          $(`#${elem.id}`).addClass('tb-hidden');
        }
      }
      return elem;
    }

    const tb_ElemActive = function(elem, act) {
      if (elem.id) {
        if (act) {
          $(`#${elem.id}`).removeClass('tb-disabled');
        } else {
          $(`#${elem.id}`).addClass('tb-disabled');
        }
      }
      return elem;
    }

    const tb_ElemRemove = function(elem) {
      if (elem.id) {
        $(`#${elem.id}`).remove();
      }
      return elem;
    }

    const TB = {
      ////////////////////////////////////////////////
      // SPEC OBJECT PROTOTYPE
      ////////////////////////////////////////////////
      Spec:function($barCont) {
        let that = this;
        this.type = 'spec';
        this.test = 'myTest';
        this.bars = [];					// managed by this.addBar() / this.removeBar()
        this.addBar = function(newBar, index) {
          newBar.parentSpec = that;
          newBar.id = `B${Math.floor(Math.random() * 100000000)}`;
          if (typeof index === 'undefined') {
            that.bars.push(newBar);
          } else {
            that.bars.splice(index, 0, newBar);
          }
          return newBar;
        };
        this.removeBar = function(index) {
          tb_ElemRemove(that);
          return that.groups.splice(index, 1);
        };
        this.render = function() {
          let html = '';
          for (let i=0; i<that.bars.length; i++) {
            html += that.bars[i].render(i);
          }
          return (tb_SpecRender(html));
        };
        this.getIndex = function($elem) {
          return $elem.attr('tb-index');
        }
        this.getItemObj = function($item) {
          let obj = {};
          let itemIndex = $item.attr('tb-index');
          let $group = $item.closest('.tb-group');
          let groupIndex = $group.attr('tb-index');
          let $bar = $group.closest('.tb-bar');
          let barIndex = $bar.attr('tb-index');
          return (that.bars[barIndex].groups[groupIndex].items[itemIndex]);
        }
        this.getElemByName = function(name) {
          let a = [];
          for (let i=0; i<that.bars.length; i++) {
            let bar = that.bars[i];
            if (bar.name === name) a.push(bar);
            for (let j=0; j<bar.groups.length; j++) {
              let group = bar.groups[j];
              if (group.name === name) a.push(group);
              for (let k=0; k<group.items.length; k++) {
                let item = group.items[k];
                if (item.name === name) a.push(item);
              }
            }
          }
          return (a);
        }
        this.destroy = function() {
          $barCont.off();
          $barCont.remove();
        }
      },
      ////////////////////////////////////////////////
      // BAR OBJECT PROTOTYPE
      ////////////////////////////////////////////////
      Bar:function(name, active, display) {
        let that = this;
        this.type = 'bar';
        this.index = -1;
        this.name = name;
        this.id = 0;						// filled by parentSpec.addBar()
        this.parentSpec = {};				// filled by parentSpec.addBar()

        this.activeProp = active;
        this.active = function (a) {
          if (a === undefined) {
            return that.activeProp;
          } else {
            tb_ElemActive(that, a);
            that.activeProp = a;
            return ('');
          }
        }
        if (this.activeProp === undefined) {
          this.active(true);
        }

        this.displayProp = display;
        this.display = function (d) {
          if (d === undefined) {
            return that.displayProp;
          } else {
            tb_ElemDisplay(that, d);
            that.displayProp = d;
            return ('');
          }
        }
        if (this.displayProp === undefined) {
          this.display(true);
        }

        this.groups = [];					// managed by this.addGroup() / this.removeGroup()
        this.addGroup = function(newGroup, index) {
          newGroup.parentBar = that;
          newGroup.id = `G${Math.floor(Math.random() * 100000000)}`;
          if (typeof index === 'undefined') {
            that.groups.push(newGroup);
          } else {
            that.groups.splice(index, 0, newGroup);
          }
          return newGroup;
        };
        this.removeGroup = function(index) {
          tb_ElemRemove(that);
          return this.groups.splice(index, 1);
        };
        this.render = function(barIndex) {
          let html = '';
          for (let i=0; i<that.groups.length; i++) {
            html += that.groups[i].render(i);
          }
          return (tb_BarRender(that, barIndex, html));
        }
      },
      ////////////////////////////////////////////////
      // GROUP OBJECT PROTOTYPE
      ////////////////////////////////////////////////
      Group:function(name, active, display, right) {
        let that = this;
        this.type = 'group';
        this.index = -1;
        this.name = name;
        this.id = 0;						// filled by parentBar.addGroup()
        this.parentBar = {};				// filled by parentBar.addGroup()
        this.activeProp = active;
        this.active = function (a) {
          if (a === undefined) {
            return that.activeProp;
          } else {
            tb_ElemActive(that, a);
            that.activeProp = a;
            return ('');
          }
        }
        if (this.activeProp === undefined) this.active(true);
        this.displayProp = display;
        this.display = function (d) {
          if (d === undefined) {
            return that.displayProp;
          } else {
            tb_ElemDisplay(that, d);
            that.displayProp = d;
            return ('');
          }
        }
        if (this.displayProp === undefined) this.display(true);
        this.right = right;

        this.items = [];					// managed by this.addItem() / this.removeItem
        this.addItem = function(newItem, index) {
          newItem.parentGroup = that;
          newItem.id = `I${Math.floor(Math.random() * 100000000)}`;
          if (typeof index === 'undefined') {
            that.items.push(newItem);
          } else {
            that.items.splice(index, 0, newItem);
          }
          return newItem;
        };
        this.removeItem = function(index) {
          tb_ElemRemove(that);
          return that.items.splice(index, 1);
        };
        this.render = function(groupIndex) {
          let html = '';
          for (let i=0; i<that.items.length; i++) {
            html += that.items[i].render(i);
          }
          return (tb_GroupRender(that, groupIndex, html));
        }
      },
      ////////////////////////////////////////////////
      // ITEM OBJECT PROTOTYPE
      ////////////////////////////////////////////////
      Item:function(name, active, display, html, title, tipHtml) {
        let that = this;
        this.type = 'item';
        this.index = -1;
        this.name = name;
        this.id = 0;						// filled by parentGroup.addItem()
        this.parentGroup = {};			// filled by parentGroup.addItem()

        this.activeProp = active;
        this.active = function (a) {
          if (a === undefined) {
            return that.activeProp;
          } else {
            tb_ElemActive(that, a);
            that.activeProp = a;
            return ('');
          }
        }
        if (this.activeProp === undefined) this.active(true);

        this.displayProp = display;
        this.display = function (d) {
          if (d === undefined) {
            return that.displayProp;
          } else {
            tb_ElemDisplay(that, d);
            that.displayProp = d;
            return ('');
          }
        }
        if (this.displayProp === undefined) this.display(true);
        
        this.anchorProp = true;
        this.anchor = function (a) {
          if (a === undefined) {
            return that.anchorProp;
          } else {
            that.anchorProp = a;
            return ('');
          }
        }

        this.htmlProp = html || 'html?' + this.id;
        this.html = function (h) {
          if (h === undefined) {
            return that.htmlProp;
          } else {
            that.htmlProp = h;
            return ('');
          }
        }

        this.tipHtmlProp = tipHtml || 'tipHtml?' + this.id;
        this.tipHtml = function (h) {
          if (h === undefined) {
            return that.tipHtmlProp;
          } else {
            that.tipHtmlProp = h;
            return ('');
          }
        }
        this.titleProp = title || '';
        this.title = function (t) {
          if (t === undefined) {
            return that.titleProp;
          } else {
            that.titleProp = t;
            return ('');
          }
        }
        this.onClickMethod = function() {};
        this.onClick = function (func) {
          if (func === undefined) {
            if ((typeof that.onClickMethod === 'function') && that.activeProp && that.displayProp) {
              that.onClickMethod(that);
            }
          } else {
            that.onClickMethod = func;
          }
        }
        this.onKeyPressMethod = function() {};
        this.onKeyPress = function (func) {
          if (func === undefined) {
            if ((typeof that.onKeyPressMethod === 'function') && that.activeProp && that.displayProp) {
              that.onKeyPressMethod(that);
            }
          } else {
            that.onKeyPressMethod = func;
          }
        }
        this.onMouseEnter = tb_onMouseEnter;
        this.onMouseLeave = tb_onMouseLeave;
        this.render = function(itemIndex) {
          return (tb_ItemRender(that, itemIndex));
        }
        this.getElemByName = function(name) {
          let a = [];
          let spec = that.parentGroup.parentBar.parentSpec;
          for (let i=0; i<spec.bars.length; i++) {
            let bar = spec.bars[i];
            if (bar.name === name) a.push(bar);
            for (let j=0; j<bar.groups.length; j++) {
              let group = bar.groups[j];
              if (group.name === name) a.push(group);
              for (let k=0; k<group.items.length; k++) {
                let item = group.items[k];
                if (item.name === name) a.push(item);
              }
            }
          }
          return (a);
        }
        this.activElemByName = function(name, show) {
          let elems = this.getElemByName(name);
          for (let i=0; i<elems.length; i++) {
            elems[i].active(act);
          }
        }
        this.displayElemByName = function(name, show) {
          let elems = this.getElemByName(name);
          for (let i=0; i<elems.length; i++) {
            elems[i].display(show);
          }
        }
        this.toggleElemByName = function(name) {
          let elems = this.getElemByName(name);
          for (let i=0; i<elems.length; i++) {
            if (elems[i].display()) {
              elems[i].display(false);
            } else {
              elems[i].display(true);
            }
          }
        }
        this.hideThisGroup = function() {
          that.parentGroup.display(false);
        }
        this.hideThisBar = function() {
          that.parentGroup.parentBar.display(false);
        }
      }
    }

    // CREATE MAIN OBJECT
    function createObj ($barCont) {
      let mainSpec = new TB.Spec($barCont);
      tbOptions.init($barCont, 
                     TB, 
                     mainSpec,
                     tbOptions);
      if (typeof tbOptions.custom === 'function') {
        tbOptions.custom($barCont, 
                         TB, 
                         mainSpec,
                         tbOptions);
      }
      $barCont.html(mainSpec.render());
      // EVENTS
      $barCont.on('click','.tb-item',function(e) {
        e.preventDefault();
        let $item = $(this);
        let item = mainSpec.getItemObj($item);
        item.onClick();
      });
      $barCont.on('keypress','.tb-item',function(e) {
        let $item = $(this);
        let item = mainSpec.getItemObj($item);
        item.onKeyPress();
      });
      $barCont.on('mouseenter','.tb-item',function(e) {
        let $item = $(this);
        let item = mainSpec.getItemObj($item);
        item.onMouseEnter(item, e);
      });
      $barCont.on('mouseleave','.tb-item',function(e) {
        let $item = $(this);
        let item = mainSpec.getItemObj($item);
        item.onMouseLeave(item);
      });
    }

    // DO FOR EACH TARGET ELEMENT
    return this.each(function() {
      let $barCont = $(this);
      if (tbOptions.destroy) {
        $barCont.off();
        $barCont.html('');
      } else {
        createObj($barCont);
      }
    });
  }
}(jQuery));
