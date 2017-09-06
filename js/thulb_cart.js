// on cart form submit, check, if items in the cart were deleted and switch
// add/remove link for those
function thulbCartFormHandler(event, data) {
  var keys = [];
  for (var i in data) {
    if (data.hasOwnProperty(i)) {
      keys.push(data[i].name);
    }
  }
  
  if (keys.indexOf('empty') > -1) {
      $('#resultlist').find('.cart-remove:visible').each(
              function(index, element) {
                  var parent = $(element).parent();
                  parent.find('.cart-add,.cart-remove').toggleClass('hidden');
              });
  } else if (keys.indexOf('delete') > -1) {
      for (var i in data) {
          if (data[i].name === 'ids[]') {
              var idHolder = $('#resultlist').find("input[value='" + data[i].value + "']");
              if (idHolder !== 'undefined') {
                var parent = idHolder.parent();
                parent.find('.cart-add,.cart-remove').toggleClass('hidden');
              }
          }
      }
  }
  
  return cartFormHandler(event, data);
}