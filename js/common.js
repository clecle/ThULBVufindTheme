/*global grecaptcha, isPhoneNumberValid */
/*exported VuFind, htmlEncode, deparam, moreFacets, lessFacets, phoneNumberFormHandler, recaptchaOnLoad, resetCaptcha, bulkFormHandler */

// IE 9< console polyfill
window.console = window.console || {log: function polyfillLog() {}};

var VuFind = (function VuFind() {
  var defaultSearchBackend = null;
  var path = null;
  var _initialized = false;
  var _submodules = [];
  var _translations = {};

  var register = function register(name, module) {
    if (_submodules.indexOf(name) === -1) {
      _submodules.push(name);
      this[name] = typeof module == 'function' ? module() : module;
    }
    // If the object has already initialized, we should auto-init on register:
    if (_initialized && this[name].init) {
      this[name].init();
    }
  };
  var init = function init() {
    for (var i = 0; i < _submodules.length; i++) {
      if (this[_submodules[i]].init) {
        this[_submodules[i]].init();
      }
    }
    _initialized = true;
  };

  var addTranslations = function addTranslations(s) {
    for (var i in s) {
      if (s.hasOwnProperty(i)) {
        _translations[i] = s[i];
      }
    }
  };
  var translate = function translate(op) {
    return _translations[op] || op;
  };

  /**
   * Reload the page without causing trouble with POST parameters while keeping hash
   */
  var refreshPage = function refreshPage() {
    var parts = window.location.href.split('#');
    if (typeof parts[1] === 'undefined') {
      window.location.href = window.location.href;
    } else {
      var href = parts[0];
      // Force reload with a timestamp
      href += href.indexOf('?') === -1 ? '?_=' : '&_=';
      href += new Date().getTime() + '#' + parts[1];
      window.location.href = href;
    }
  };

  //Reveal
  return {
    defaultSearchBackend: defaultSearchBackend,
    path: path,

    addTranslations: addTranslations,
    init: init,
    refreshPage: refreshPage,
    register: register,
    translate: translate
  };
})();

/* --- GLOBAL FUNCTIONS --- */
function htmlEncode(value) {
  if (value) {
    return $('<div />').text(value).html();
  } else {
    return '';
  }
}
function extractClassParams(selector) {
  var str = $(selector).attr('class');
  if (typeof str === "undefined") {
    return [];
  }
  var params = {};
  var classes = str.split(/\s+/);
  for (var i = 0; i < classes.length; i++) {
    if (classes[i].indexOf(':') > 0) {
      var pair = classes[i].split(':');
      params[pair[0]] = pair[1];
    }
  }
  return params;
}
// Turn GET string into array
function deparam(url) {
  if (!url.match(/\?|&/)) {
    return [];
  }
  var request = {};
  var pairs = url.substring(url.indexOf('?') + 1).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    var name = decodeURIComponent(pair[0].replace(/\+/g, ' '));
    if (name.length === 0) {
      continue;
    }
    if (name.substring(name.length - 2) === '[]') {
      name = name.substring(0, name.length - 2);
      if (!request[name]) {
        request[name] = [];
      }
      request[name].push(decodeURIComponent(pair[1].replace(/\+/g, ' ')));
    } else {
      request[name] = decodeURIComponent(pair[1].replace(/\+/g, ' '));
    }
  }
  return request;
}

// Sidebar
function moreFacets(id) {
  $('.' + id).removeClass('hidden');
  $('#more-' + id).addClass('hidden');
  return false;
}
function lessFacets(id) {
  $('.' + id).addClass('hidden');
  $('#more-' + id).removeClass('hidden');
  return false;
}
function facetSessionStorage(e) {
  var source = $('#result0 .hiddenSource').val();
  var id = e.target.id;
  var key = 'sidefacet-' + source + id;
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, document.getElementById(id).className);
  } else {
    sessionStorage.removeItem(key);
  }
}

// Phone number validation
function phoneNumberFormHandler(numID, regionCode) {
  var phoneInput = document.getElementById(numID);
  var number = phoneInput.value;
  var valid = isPhoneNumberValid(number, regionCode);
  if (valid !== true) {
    if (typeof valid === 'string') {
      valid = VuFind.translate(valid);
    } else {
      valid = VuFind.translate('libphonenumber_invalid');
    }
    $(phoneInput).siblings('.help-block.with-errors').html(valid);
    $(phoneInput).closest('.form-group').addClass('sms-error');
    return false;
  } else {
    $(phoneInput).closest('.form-group').removeClass('sms-error');
    $(phoneInput).siblings('.help-block.with-errors').html('');
  }
}

// Setup captchas after Google script loads
function recaptchaOnLoad() {
  if (typeof grecaptcha !== 'undefined') {
    var captchas = $('.g-recaptcha:empty');
    for (var i = 0; i < captchas.length; i++) {
      $(captchas[i]).data('captchaId', grecaptcha.render(captchas[i], $(captchas[i]).data()));
    }
  }
}
function resetCaptcha($form) {
  if (typeof grecaptcha !== 'undefined') {
    var captcha = $form.find('.g-recaptcha');
    if (captcha.length > 0) {
      grecaptcha.reset(captcha.data('captchaId'));
    }
  }
}

function bulkFormHandler(event, data) {
  if ($('.checkbox-select-item:checked,checkbox-select-all:checked').length === 0) {
    VuFind.lightbox.alert(VuFind.translate('bulk_noitems_advice'), 'danger');
    return false;
  }
  for (var i in data) {
    if ('print' === data[i].name) {
      return true;
    }
  }
}

// Ready functions
function setupOffcanvas() {
  if ($('.sidebar').length > 0) {
    $('[data-toggle="offcanvas"]').click(function offcanvasClick() {
      $('body.offcanvas').toggleClass('active');
      var active = $('body.offcanvas').hasClass('active');
      var right = $('body.offcanvas').hasClass('offcanvas-right');
      if ((active && !right) || (!active && right)) {
        $('.offcanvas-toggle .fa').removeClass('fa-chevron-right').addClass('fa-chevron-left');
      } else {
        $('.offcanvas-toggle .fa').removeClass('fa-chevron-left').addClass('fa-chevron-right');
      }
      $('.offcanvas-toggle .fa').attr('title', VuFind.translate(active ? 'sidebar_close' : 'sidebar_expand'));
    });
    $('[data-toggle="offcanvas"]').click().click();
  } else {
    $('[data-toggle="offcanvas"]').addClass('hidden');
  }
}

function setupAutocomplete() {
  // Search autocomplete
  $('#searchForm_lookfor').autocomplete({
    maxResults: 10,
    loadingString: VuFind.translate('loading') + '...',
    handler: function vufindACHandler(input, cb) {
      var query = input.val();
      var searcher = extractClassParams(input);
      var hiddenFilters = [];
      $('#searchForm').find('input[name="hiddenFilters[]"]').each(function hiddenFiltersEach() {
        hiddenFilters.push($(this).val());
      });
      $.fn.autocomplete.ajax({
        url: VuFind.path + '/AJAX/JSON',
        data: {
          q: query,
          method: 'getACSuggestions',
          searcher: searcher.searcher,
          type: searcher.type ? searcher.type : $('#searchForm_type').val(),
          hiddenFilters: hiddenFilters
        },
        dataType: 'json',
        success: function autocompleteJSON(json) {
          if (json.data.length > 0) {
            var datums = [];
            for (var j = 0; j < json.data.length; j++) {
              datums.push(json.data[j]);
            }
            cb(datums);
          } else {
            cb([]);
          }
        }
      });
    }
  });
  // Update autocomplete on type change
  $('#searchForm_type').change(function searchTypeChange() {
    $('#searchForm_lookfor').autocomplete('clear cache');
  });
}

/**
 * Handle arrow keys to jump to next record
 */
function keyboardShortcuts() {
  var $searchform = $('#searchForm_lookfor');
  if ($('.pager').length > 0) {
    $(window).keydown(function shortcutKeyDown(e) {
      if (!$searchform.is(':focus')) {
        var $target = null;
        switch (e.keyCode) {
        case 37: // left arrow key
          $target = $('.pager').find('a.previous');
          if ($target.length > 0) {
            $target[0].click();
            return;
          }
          break;
        case 38: // up arrow key
          if (e.ctrlKey) {
            $target = $('.pager').find('a.backtosearch');
            if ($target.length > 0) {
              $target[0].click();
              return;
            }
          }
          break;
        case 39: //right arrow key
          $target = $('.pager').find('a.next');
          if ($target.length > 0) {
            $target[0].click();
            return;
          }
          break;
        case 40: // down arrow key
          break;
        }
      }
    });
  }
}

/**
 * Setup facets
 */
function setupFacets() {
  // Advanced facets
  $('.facetAND,.facetOR').click(function facetBlocking() {
    $(this).closest('.collapse').html('<div class="list-group-item">' + VuFind.translate('loading') + '...</div>');
    window.location.assign($(this).attr('href'));
  });

  $('ul[class=pagination] li,select[name=sort] option,.authorLink,.langOption,.facetAND,.facetOR,.facetTAB,.facetRANGE,#fulltext_limit,#exclude_newspapers').click(function resultlistOverlay() {
    $("#searchcontent").css('pointer-events', 'none');
    $("#searchcontent").css('opacity', '0.5');

    $("#img-load").css({
      top   : '50%',
      left  : '50%'
    });
    
    $("#overlay").fadeIn();
    $("#img-load").fadeIn();
  });

  // Side facet status saving
  $('.facet.list-group .collapse').each(function openStoredFacets(index, item) {
    var source = $('#result0 .hiddenSource').val();
    var storedItem = sessionStorage.getItem('sidefacet-' + source + item.id);
    if (storedItem) {
      var saveTransition = $.support.transition;
      try {
        $.support.transition = false;
        if ((' ' + storedItem + ' ').indexOf(' in ') > -1) {
          $(item).collapse('show');
        } else {
          $(item).collapse('hide');
        }
      } finally {
        $.support.transition = saveTransition;
      }
    }
  });
  $('.facet.list-group .collapse').on('shown.bs.collapse', facetSessionStorage);
  $('.facet.list-group .collapse').on('hidden.bs.collapse', facetSessionStorage);
}

function setupIeSupport() {
  // Disable Bootstrap modal focus enforce on IE since it breaks Recaptcha.
  // Cannot use conditional comments since IE 11 doesn't support them but still has
  // the issue
  var ua = window.navigator.userAgent;
  if (ua.indexOf('MSIE') || ua.indexOf('Trident/')) {
    $.fn.modal.Constructor.prototype.enforceFocus = function emptyEnforceFocus() { };
  }
}

function setAsyncResultNum() {
    var lookfor = $('#searchForm_lookfor').val();
    var type = $('#searchForm_type option:checked').val();
    var index = '';
    
    
    if (['AllFields', 'Title', 'Author', 'Subject', 'SubjectTerms'].indexOf(type) < 0) {
        type = 'AllFields';
    } else if (type === 'Subject') {
        type = 'SubjectTerms';
    } else if (type === 'SubjectTerms') {
        type = 'Subject';
    }
    
    if ($('span.resultNumSummon').length) {
        index = 'Summon';
    } else if ($('span.resultNumSolr').length) {
        index = 'Solr';
    }
    
    if (index.length > 0) {
        $.ajax({
            dataType: 'json',
            method: 'POST',
            url: VuFind.path + '/AJAX/JSON?method=getResultCount',
            data: {'lookfor': lookfor, 'index': index, 'type': type}
        }).done(function writeCount (response) {
            $('span.resultNum' + index).text(response.data['count']);
        }).fail(function() {
            $('span.resultNum' + index).addClass('hidden');
        });
    }
}

function setupTruncations() {
    var truncatedParagraphs = $('p.truncate');
    var truncatedLinks = $('a.truncate');
    var pTruncLength = 300;
    var aTruncRatio = 0.25;
    
    // apply truncations
    truncatedParagraphs.each(function() { 
        var t = $(this).text();
        if(t.length < pTruncLength) {
            return;
        }
        
        $(this).html(
            t.slice(0,pTruncLength)+'<a href="#" class="more"> ' + VuFind.translate('truncate_more') + '</a>'+
            '<span style="display:none;">'+ t.slice(pTruncLength,t.length)+' <a href="#" class="less"> ' + VuFind.translate('truncate_less') + '</a></span>'
        );
    });
    
    truncatedLinks.each(function() {
        var t = $(this).text();
        var visibleWidth = $(this).parent().innerWidth();
        if(t.length > (aTruncRatio * visibleWidth)) {
            var h = $(this).html();
            $(this).tooltip({title: h, delay: {show: 500, hide: 100}, html: true, placement: 'auto'});
        }
    });
    
    // setup additional behaviour to show full content
    $('a.more', truncatedParagraphs).click(function(event){
        event.preventDefault();
        $(this).hide().prev().hide();
        $(this).next().show();        
    });
    
    $('a.less', truncatedParagraphs).click(function(event){
        event.preventDefault();
        $(this).parent().hide().prev().show().prev().show();    
    });
}

$(document).ready(function commonDocReady() {
  // Start up all of our submodules
  VuFind.init();
  // Setup search autocomplete
  setupAutocomplete();
  // Off canvas
  setupOffcanvas();
  // Keyboard shortcuts in detail view
  keyboardShortcuts();
  // truncation for paragraphs
  setupTruncations();

  // support "jump menu" dropdown boxes
  $('select.jumpMenu').change(function jumpMenu(){ $(this).parent('form').submit(); });
  
  // support other form input elements to auto submit
  $('input.jumpMenu').change(function jumpMenu(){ $(this).parent('form').submit(); });

  // Checkbox select all
  $('.checkbox-select-all').change(function selectAllCheckboxes() {
    var $form = $(this).closest('form');
    $form.find('.checkbox-select-item').not(':disabled').prop('checked', this.checked);
    $('[form="' + $form.attr('id') + '"]').prop('checked', this.checked);
  });
  $('.checkbox-select-item').change(function selectAllDisable() {
    var $form = $(this).closest('form');
    if ($form.length === 0 && this.form) {
      $form = $(this.form);
    }
    if ($form.length === 0) {
      return;
    }
    $form.find('.checkbox-select-all').prop('checked', false);
    $('.checkbox-select-all[form="' + $form.attr('id') + '"]').prop('checked', false);
  });

  // handle QR code links
  $('a.qrcodeLink').click(function qrcodeToggle() {
    if ($(this).hasClass("active")) {
      $(this).html(VuFind.translate('qrcode_show')).removeClass("active");
    } else {
      $(this).html(VuFind.translate('qrcode_hide')).addClass("active");
    }

    var holder = $(this).next('.qrcode');
    if (holder.find('img').length === 0) {
      // We need to insert the QRCode image
      var template = holder.find('.qrCodeImgTag').html();
      holder.html(template);
    }
    holder.toggleClass('hidden');
    return false;
  });

  // Print
  var url = window.location.href;
  if (url.indexOf('?' + 'print' + '=') !== -1 || url.indexOf('&' + 'print' + '=') !== -1) {
    $("link[media='print']").attr("media", "all");
    $(document).ajaxStop(function triggerPrint() {
      window.print();
    });
    // Make an ajax call to ensure that ajaxStop is triggered
    $.getJSON(VuFind.path + '/AJAX/JSON', {method: 'keepAlive'});
  }

  setupFacets();
  setAsyncResultNum();

  // retain filter sessionStorage
  $('.searchFormKeepFilters').click(function retainFiltersInSessionStorage() {
    sessionStorage.setItem('vufind_retain_filters', this.checked ? 'true' : 'false');
  });
  if (sessionStorage.getItem('vufind_retain_filters')) {
    var state = (sessionStorage.getItem('vufind_retain_filters') === 'true');
    $('.searchFormKeepFilters').prop('checked', state);
    $('#applied-filter').prop('checked', state);
  }

  setupIeSupport();

  /*
   * smooth vertical scroll through page
   * mainly used for filter-button in mobile-view
   */
  $('a[href^="#"]').on('click', function(event) {
    var target = $(this.getAttribute('href'));
    if( target.length ) {
        event.preventDefault();
        $('html, body').stop().animate({
            scrollTop: target.offset().top
        }, 1000);
    }
  });

});