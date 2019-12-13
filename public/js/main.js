$(document).ready(function() {
  $("#nSubmit").on("click", function(e) {
    $.getJSON("/resetKey?ip=127.0.0.1", null, function(res) {
      var result = "";
      if (res) {
        result = "successful";
      } else {
        result = "Didn't found the ip address, it may be reseted already";
      }
      $("#result").html(result);
    });
  });
});
