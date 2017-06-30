var tags = [
  'canelon',
  'pet3325C'
];
var foo = document.querySelectorAll('.plupload_info.large-push-2');

foo.forEach(function(item) {
  var title = item.querySelector('h4').innerText;
  title = title.slice(12, title.length - 4);
  item.querySelector('.plupload_file_title > input').value = title;
});

foo = document.querySelectorAll('.plupload_file_tags');

foo.forEach(function(item) {
  tags.forEach(function(tag) {
    var input = item.querySelector('.tagsinput > div > input');
    input.value = tag;
    var event = new FocusEvent('blur');
    input.dispatchEvent(event);
  });
});


/** Open video links. Use after they've been populated */
var foo = document.querySelectorAll('.plupload_info.large-pull-10');
// var windows = [];

foo.forEach(function(item) {
  var link = item.querySelector('.plupload_view_action > a')
  if (link) {
    // link.querySelector('a').click();
    // windows.push(window.open(link.href));
    let child = window.open(link.href);
    console.log(child);
    console.log(child.document.getElementById('permalink').value);
    child.close();
  }
});