(function() {
  $('.destroy').live('click', function(e) {
    var element = $(this),
        form = $('<form></form>');
    e.preventDefault();
    form
      .attr({
        method: 'POST',
        action: element.attr('href')
      })
      .hide()
      .append('<input type="hidden" />')
      .find('input')
      .attr({
        'name': '_method',
        'value': 'delete'
      })
      .end()
      .submit();
  });
})();
