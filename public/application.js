$(function(){
  $("form.github-fetch-form").submit(function(e){
    form = $(this);
    $.ajax({
      url: form.attr('action'),
      type: "POST",
      data: form.serializeArray(),
      success: function(data, textStatus, jqXHR) {
        console.log(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log('Error queuing job');
      }
    });
    e.preventDefault();
  });
});
