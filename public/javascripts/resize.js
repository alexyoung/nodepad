(function() {
  // Correct widths and heights based on window size
  function resize() {
    var height = $(window).height() - $('#header').height() - 1,
        width = $('.content').width(),
        ov = $('.outline-view'),
        ed = $('#editor'),
        toolbar = $('.toolbar'),
        divider = $('.content-divider'),
        content = $('.content'),
        controls = $('#controls');

    $('#DocumentTitles').css({ height: height - toolbar.height() + 'px' });
    ov.css({ height: height + 'px' });
    toolbar.css({ width: ov.width() + 'px' });

    content.css({
      height: height - controls.height() + 'px',
      width: $('body').width() - ov.width() - divider.width() - 1 + 'px'
    });

    divider.css({ height: height + 'px' });

    ed.css({
      width: content.width() + 'px',
      height: content.height() - 22 - $('input.title').height() + 'px'
    }).focus();

    $('#controls').css({
      width: content.width() + 'px'
    });
  }

  $(window).resize(resize);
  $(window).focus(resize);
  resize();
})();

