if ((typeof Shopify) === 'undefined') { window.Shopify = {}; }
  // Get from cart.js returns the cart in JSON
  if ((typeof Shopify.getCart) === 'undefined') {
  Shopify.getCart = function(callback, cart) {
    if(!cart){
    return jQuery.getJSON('/cart.js', function (cart, textStatus, xhr) {
        if ((typeof callback) === 'function') {
        callback(cart,textStatus, xhr);
      }
      else {
        Shopify.onCartUpdate(cart);
          }
      });
    }else{
      if ((typeof callback) === 'function') {
      callback(cart);
    }else if(typeof Shopify.onCartUpdate ==='function') {
      Shopify.onCartUpdate(cart);
        }
    }
  };
}

"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var sideCart = window.sideCart || [];
Shopify.theme.jsAjaxCart = {
  init: function init($section) {
    // Add settings from schema to current object
    Shopify.theme.jsAjaxCart = $.extend(this, Shopify.theme.getSectionData($section));

    if (isScreenSizeLarge() || this.cart_action == 'drawer') {
      this.initializeAjaxCart();
    } else {
      this.initializeAjaxCartOnMobile();
    }

    if (this.cart_action == 'drawer') {
      this.ajaxCartDrawer = $('[data-ajax-cart-drawer]');
      $(document).on('click', '[data-ajax-cart-trigger]', function (e) {
        e.preventDefault();
//         sideCart.push('open');
        Shopify.theme.jsAjaxCart.showDrawer();
        return false;
      });
    } else if (this.cart_action == 'mini_cart') {
      this.showMiniCartOnHover();
    }

    $(document).on('click', '.ajax-submit', function (e) {
      e.preventDefault();
      var $addToCartForm = $(this).closest('form');
      Shopify.theme.jsAjaxCart.addToCart($addToCartForm);
      return false;
    });
    $(document).on('click', '[data-ajax-cart-delete]', function (e) {
      e.preventDefault();
      var lineID = $(this).parents('[data-line-item]').data('line-item');
      Shopify.theme.jsAjaxCart.removeFromCart(lineID);

      if (Shopify.theme.jsCart) {
        Shopify.theme.jsCart.removeFromCart(lineID);
      }

      return false;
    });
    $(document).on('click', '[data-ajax-cart-close]', function (e) {
      e.preventDefault();
      Shopify.theme.jsAjaxCart.hideDrawer();
      Shopify.theme.jsAjaxCart.hideMiniCart();
      return false;
    });
  },
  showMiniCartOnHover: function showMiniCartOnHover() {
    var $el = $('[data-ajax-cart-trigger]');
    $el.hover(function () {
      $el.addClass('show-mini-cart');
    }, function () {
      $el.removeClass('show-mini-cart');
    });
  },
  hideMiniCart: function hideMiniCart() {
    if (this.cart_action != 'mini_cart') return false;
    var $el = $('[data-ajax-cart-close]').parents('[data-ajax-cart-trigger]');
    $el.removeClass('show-mini-cart');
  },
  toggleMiniCart: function toggleMiniCart() {
    var $el = $('.mobile-header [data-ajax-cart-trigger]'); // Removes url to the cart page so user is not redirected

    $el.attr('href', '#');
    $el.off('click').on('click', function (e) {
      // If user clicks inside the element, do nothing
      if (e.target.closest('[data-ajax-cart-mini_cart]')) {
        return;
      } // Loads content into ajaxCart container for mobile header


      Shopify.theme.jsAjaxCart.initializeAjaxCartOnMobile(); // If user clicks outside the element, toggle the mini cart

      $el.toggleClass('show-mini-cart'); // Calculate height of mini cart

      var announcementHeight = 0;
      var mobileHeaderHeight = parseInt($('.mobile-header').height());

      if (typeof Shopify.theme.jsAnnouncementBar !== 'undefined' && Shopify.theme.jsAnnouncementBar.enable_sticky) {
        announcementHeight = Shopify.theme.jsAnnouncementBar.getAnnouncementHeight();
      }

      $('.mobile-header .theme-ajax-cart').css({
        height: "calc(100vh - ".concat(mobileHeaderHeight + announcementHeight, "px)")
      });
    });
  },
  showDrawer: function showDrawer() {
    if (this.cart_action != 'drawer') return false;
    this.ajaxCartDrawer.addClass('is-visible');
    $('.ajax-cart__overlay').addClass('is-visible');
  },
  hideDrawer: function hideDrawer() {
    if (this.cart_action != 'drawer') return false;
    this.ajaxCartDrawer.removeClass('is-visible');
    $('.ajax-cart__overlay').removeClass('is-visible');
  },
  removeFromCart: function removeFromCart(lineID, callback) {
    $.ajax({
      type: 'POST',
      url: '/cart/change.js',
      data: 'quantity=0&line=' + lineID,
      dataType: 'json',
      success: function success(cart) {
        Shopify.getCart(function(cart) {
        Shopify.theme.jsAjaxCart.updateView();
        });
      },
      error: function error(XMLHttpRequest, textStatus) {
        var response = eval('(' + XMLHttpRequest.responseText + ')');
        response = response.description;
      }
    });
  },
  initializeAjaxCart: function initializeAjaxCart() {
    Shopify.theme.asyncView.load('/cart', // template name
    'ajax' // view name (suffix)
    ).done(function (_ref) {
      var html = _ref.html,
          options = _ref.options;
      $('[data-ajax-cart-content]').html(html.content);

      if (Shopify.theme_settings.show_multiple_currencies) {
        convertCurrencies();
      }
    }).fail(function () {// some error handling
    });
  },
  initializeAjaxCartOnMobile: function initializeAjaxCartOnMobile() {
    this.toggleMiniCart();
    Shopify.theme.asyncView.load('/cart', // template name
    'ajax' // view name (suffix)
    ).done(function (_ref2) {
      var html = _ref2.html,
          options = _ref2.options;
      $('.mobile-header [data-ajax-cart-content]').html(html.content);

      if (Shopify.theme_settings.show_multiple_currencies) {
        convertCurrencies();
      }
    }).fail(function () {// some error handling
    });
  },
  addToCart: function addToCart($addToCartForm) {
//     var data = {
//       quantity: 1,
//       properties: {}
//     };

//     $addToCartForm.find('input, select, textarea').each(function()
//     {
//       var name = $(this).prop('name');
//       if (name.indexOf('properties') === 0)
//       {
//         var pName = name.replace('properties', '').replace(/\[|\]/g, '');
//         data['properties'][pName] = $(this).val();
//       }
//       else
//       {
//         data[name] = $(this).val();
//       }

//     });

//     sideCart.push('add-item', data);
//     sideCart.push('open');
//     return;

    var $addToCartBtn = $addToCartForm.find('.button--add-to-cart');
    $.ajax({
      url: '/cart/add.js',
      dataType: 'json',
      cache: false,
      type: 'post',
      data: $addToCartForm.serialize(),
      beforeSend: function beforeSend() {
        $addToCartBtn.attr('disabled', 'disabled').addClass('disabled');
        $addToCartBtn.find('span').removeClass("fadeInDown").addClass('animated zoomOut');
      },
      success: function success(product) {
        Shopify.getCart(function(cart) {
        var $el = $('[data-ajax-cart-trigger]');
        $addToCartBtn.find('.checkmark').addClass('checkmark-active');

        function addedToCart() {
          if (!isScreenSizeLarge()) {
            $el = $('.mobile-header [data-ajax-cart-trigger]');
            Shopify.theme.scrollToTop($el);
          } else {
            $el = $('[data-ajax-cart-trigger]');
          }

          $el.addClass('show-mini-cart');
          $addToCartBtn.find('span').removeClass('fadeInDown');
        }

        window.setTimeout(function () {
          $addToCartBtn.removeAttr('disabled').removeClass('disabled');
          $addToCartBtn.find('.checkmark').removeClass('checkmark-active');
          $addToCartBtn.find('span').removeClass('zoomOut').addClass('fadeInDown');
          $addToCartBtn.on('webkitAnimationEnd oanimationend msAnimationEnd animationend', addedToCart);
        }, 1000);
        Shopify.theme.jsAjaxCart.showDrawer();
        Shopify.theme.jsAjaxCart.updateView();

        if (Shopify.theme.jsCart) {
          var _$$ajax;

          $.ajax((_$$ajax = {
            dataType: "json",
            async: false,
            cache: false
          }, _defineProperty(_$$ajax, "dataType", 'html'), _defineProperty(_$$ajax, "url", "/cart"), _defineProperty(_$$ajax, "success", function success(html) {
            var cartForm = $(html).find('.cart__form');
            $('.cart__form').replaceWith(cartForm);

            if (Shopify.theme_settings.show_multiple_currencies) {
              convertCurrencies();
            }
          }), _$$ajax));
        }
          });
      },
      error: function error(XMLHttpRequest) {
        var response = eval('(' + XMLHttpRequest.responseText + ')');
        response = response.description;
        var cartWarning = "<p class=\"cart-warning__message animated bounceIn\">".concat(response.replace('All 1 ', 'All '), "</p>");
        $('.warning').remove();
        $addToCartForm.find('.cart-warning').html(cartWarning);
        $addToCartBtn.removeAttr('disabled').removeClass('disabled');
        $addToCartBtn.find('span').text(Shopify.translation.addToCart).removeClass('zoomOut').addClass('zoomIn');
      }
    });
  },
  updateView: function updateView() {
    Shopify.theme.asyncView.load('/cart', // template name
    'ajax' // view name (suffix)
    ).done(function (_ref3) {
      var html = _ref3.html,
          options = _ref3.options;

      if (options.item_count > 0) {
        var itemList = $(html.content).find('.ajax-cart__list');
        var cartDetails = $(html.content).find('.ajax-cart__details-wrapper');
        $('.ajax-cart__list').replaceWith(itemList);
        $('.ajax-cart__details-wrapper').replaceWith(cartDetails);
        $('.ajax-cart__empty-cart-message').addClass('is-hidden');
        $('.ajax-cart__form').removeClass('is-hidden');
        $('[data-ajax-cart-trigger]').addClass('has-cart-count');
        $('[data-bind="itemCount"]').text(options.item_count);
      } else {
        $('.ajax-cart__empty-cart-message').removeClass('is-hidden');
        $('.ajax-cart__form').addClass('is-hidden');
        $('[data-ajax-cart-trigger]').removeClass('has-cart-count');
        $('[data-bind="itemCount"]').text('0');
      }

      if (Shopify.theme_settings.show_multiple_currencies) {
        convertCurrencies();
      }
    }).fail(function () {// some error handling
    });
  },
  unload: function unload($section) {
    // Clear event listeners in theme editor
    $('.ajax-submit').off();
    $('[data-ajax-cart-delete]').off();
  }
};