/*global VuFind */
function linkCallnumbers(callnumber, callnumber_handler) {
  if (callnumber_handler) {
    var cns = callnumber.split(',\t');
    for (var i = 0; i < cns.length; i++) {
      cns[i] = '<a href="' + VuFind.path + '/Alphabrowse/Home?source=' + encodeURI(callnumber_handler) + '&amp;from=' + encodeURI(cns[i]) + '">' + cns[i] + '</a>';
    }
    return cns.join(',\t');
  }
  return callnumber;
}

function checkItemStatuses(_container) {
  var container = _container || $('body');

  var elements = {};
  var data = $.map(container.find('.ajaxItem'), function ajaxItemMap(record) {
    if ($(record).find('.hiddenId').length === 0) {
      return null;
    }
    var datum = $(record).find('.hiddenId').val();
    if (typeof elements[datum] === 'undefined') {
      elements[datum] = $();
    }
    elements[datum] = elements[datum].add($(record));
    return datum;
  });
  if (!data.length) {
    return;
  }

  $(".ajax-availability").removeClass('hidden');
  $.ajax({
    dataType: 'json',
    method: 'POST',
    url: VuFind.path + '/AJAX/JSON?method=getItemStatuses',
    data: {'id': data}
  })
  .done(function checkItemStatusDone(response) {
    $.each(response.data, function checkItemDoneEach(i, result) {
      var item = elements[result.id];
      if (!item) {
        return;
      }

      item.find('.status').empty().append(result.availability_message);
    });

    $(".ajax-availability").removeClass('ajax-availability');
  })
  .fail(function checkItemStatusFail(response, textStatus) {
    $('.ajax-availability').empty();
    if (textStatus === 'abort' || typeof response.responseJSON === 'undefined') { return; }
    // display the error message on each of the ajax status place holder
    $('.ajax-availability').append(response.responseJSON.data).addClass('text-danger');
  });
}

$(document).ready(function checkItemStatusReady() {
  checkItemStatuses();
});
