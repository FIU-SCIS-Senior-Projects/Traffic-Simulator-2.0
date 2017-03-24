function ShowDropZone() 
{
    dropZone.style.visibility = "visible";
}
function HideDropZone() 
{
    dropZone.style.visibility = "hidden";
}

function AllowDrag(e) 
{
    // Change the source element's background color to signify drag has started
    e.currentTarget.style.border = "dashed";
    e.preventDefault();
}

// FORMAT THIS CORRECTLY!!! 
function HandleDrop(e, callback) {
    e.preventDefault();
    HideDropZone();

    // If dropped items aren't files, reject them
    var dt = e.dataTransfer;
    if (dt.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (var i=0; i < dt.items.length; i++) {

          if (dt.items[i].kind == "file") {
            var f = dt.items[i].getAsFile();
            //console.log("... file[" + i + "].name = " + f.name);
            
              // validate file type and size

              var reader = new FileReader();
                reader.onloadend = function(e) {
                var data = JSON.parse(this.result);
                callback(data);
              };
              
              reader.readAsText(f);

              

          
        }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (var i=0; i < dt.files.length; i++) {
          //console.log("... file[" + i + "].name = " + dt.files[i].name);
        }  
    }
    
    // Clear the drag data cache (for all formats/types)
    e.dataTransfer.clearData();
}

