/*global Hunt, VuFind */
VuFind.register('doi', function Doi() {
    function embedDoiLinks(el) {
        var element = $(el);
        var doi = [];
        var elements = element.hasClass('doiLink') ? element : element.find('.doiLink');
        elements.each(function extractDoiData(i, doiLinkEl) {
            var currentDoi = $(doiLinkEl).data('doi');
            if (doi.indexOf(currentDoi) === -1) {
                doi[doi.length] = currentDoi;
            }
        });
        if (doi.length === 0) {
            return;
        }
        var url = VuFind.path + '/AJAX/JSON?' + $.param({
            method: 'doiLookup',
            doi: doi,
        });
        $.ajax({
            dataType: 'json',
            url: url
        })
        .done(function embedDoiLinksDone(response) {
            elements.each(function populateDoiLinks(x, doiEl) {
                var currentDoi = $(doiEl).data('doi');

                var loadingImg = $(doiEl).prev();
                if($(loadingImg).is('img')) {
                    $(loadingImg).hide();
                }

                if ("undefined" !== typeof response.data[currentDoi]) {
                    $(doiEl).empty();
                    var externalIcon = $('<div />');
                    externalIcon.html('<i class="fa fa-unlock-alt"></i>');
                    for (var i = 0; i < response.data[currentDoi].length; i++) {
                        var newLink = $('<a />');
                        newLink.attr('href', response.data[currentDoi][i].link);
                        newLink.attr('target', '_blank');
                        newLink.attr('class', 'btn btn-primary btn-xs unpaywall');
                        newLink.text(' ' + response.data[currentDoi][i].label);
                        newLink.prepend(externalIcon);
                        if (typeof response.data[currentDoi][i].icon !== 'undefined') {
                            var icon = $('<img />');
                            icon.attr('src', response.data[currentDoi][i].icon);
                            icon.attr('class', 'doi-icon');
                            $(doiEl).append(icon);
                        }
                        $(doiEl).append(newLink);
                        if(!$(doiEl).next().is('a')) {
                            $(doiEl).append("<br />");
                        }
                    }
                }
                else {
                    $(doiEl).parent().hide();
                }
            });
        });
    }

    // Assign actions to the OpenURL links. This can be called with a container e.g. when
    // combined results fetched with AJAX are loaded.
    function init(_container) {
        var container = _container || $('body');
        // assign action to the openUrlWindow link class
        if (typeof Hunt === 'undefined') {
            embedDoiLinks(container);
        } else {
            new Hunt(
                container.find('.doiLink').toArray(),
                { enter: embedDoiLinks }
            );
        }
    }
    return {
        init: init,
        embedDoiLinks: embedDoiLinks
    };
});
