var ROOT_URL = 'http://localhost:8081/';
function renderForm(apendTo, options){
      var form = $(document.createElement('form'));
      $(form).attr("action", ROOT_URL+options.url);
      $(form).attr("method", options.method);
      //$(form).attr("class", 'form-inline');
      if(options.enctype)  $(form).attr("enctype", 'multipart/form-data');
      if(options.placeholder) options.placeholder+=" , above mentioned URL params are just placeholders, provide actual values to see appropriate results.";
      else options.placeholder="";
      if(options.payloadType && options.payloadType=="json")
         $(form).attr("enctype", 'application/json');

      $(form).append('<input type="text" class="form-control url"  value="'+ROOT_URL+options.url+'"><div class="alert alert-warning">'+options.placeholder+'</div>');
     $(form).append('<input type="hidden" name="isSandbox" value="true">');
      $.each(options.elements, function(ind, el){
        if(!el.placeholder) el.placeholder = "";
        if(!el.value) el.value = "";
          var _cont = '<div class="form-group"><label for="'+el.name+'">'+el.label+'</label><input type="'+el.type+'" class="form-control" placeholder="'+el.placeholder+'" value="'+el.value+'" name="'+el.name+'" '+el.isRequired+'></div>';
          $(form).append(_cont);
      });
      $(form).append('<div class="form-group"><input type="submit" value="Try" class="btn"></div>');
      $(apendTo).append(form);
     }


function attachAjaxActionForms(forms){
 $.each(forms, function(ind,frm){
  //var tempUrl = $(frm).children('.url').val();
    $(frm).on('submit', function (e) {
      if($(frm).next('div.target').length == 0){
        $(frm).after('<div class="target"><span class="cross">X</span> <pre class="request"> </pre> <pre class="response"></pre> </div>');
        $(frm).next('pre.target').before('<span class="cross">X</span>')
        $('span.cross').on('click', function(e){
         $(this).parent().slideUp(100);
        });
        //console.log($($(frm).next('div.target').children()[0]));
      }
      var _preChild = $(frm).next('div.target').children();
      $(_preChild[2]).html('Loading');
      $(_preChild[1]).html('');
      $(frm).next('div.target').show();

        $(_preChild[1]).html("Request URL: <br>"+$(frm).children('.url').val()+"<br>");
        e.preventDefault();
        var fdat = $(frm).serialize();
         if($('#userToken').val() !="") fdat = fdat.replace('isSandbox=true','');
        //if file attachment in form exist, create FormData object

       var ajaxOpts = {
            type: $(frm).attr('method'),
            url: $(frm).children('.url').val(),
            data: fdat,
            success: function (data) {
              //console.log(typeof data);
                if(typeof data != 'object')
                data = JSON.parse(data);
                $(_preChild[2]).html(JSON.stringify(data, null, " "));
            },
            error: function (data){
              //console.log( data);
              data = {success:0, message: data.status +' '+data.statusText}
              $(_preChild[2]).html(JSON.stringify(data, null, " "));
            }
        };
      if($(frm).attr('enctype') == 'application/json'){
        var _fin ={};
          $.each(fdat.split('&'), function(ind, el){
               var _params = el.split('=');
               var _spt = _params[0].split('.');
               for(var i=0; i<(--_spt.length); i++){
                  if(_spt.length ==1 && (_params[1] && decodeURIComponent(_params[1])!=" "))
                  if(!_fin[_spt[i]]) _fin[_spt[i]] = {};
                  if(_spt.length ==2 && (_params[1] && decodeURIComponent(_params[1])!=" ")){
                  if(!_fin[_spt[i]]) _fin[_spt[i]] = {};
                  if(!_fin[_spt[0]][_spt[1]] ) _fin[_spt[0]][_spt[1]] = {};
                  }
               }
                if(_params[1] && decodeURIComponent(_params[1])!=" "){
                  if(_params[1].toLowerCase() == 'true' || _params[1].toLowerCase() == 'false')
                    _params[1] = stringToBoolean(_params[1]);
                  eval('_fin.'+_params[0]+'="'+decodeURIComponent(_params[1])+'"');
                }
          });
        ajaxOpts.data = JSON.stringify(_fin);
        ajaxOpts.dataType= 'json';
        ajaxOpts.contentType = "application/json";
        ajaxOpts.traditional = true;
        var _temp = _fin;
        delete _temp.isSandbox
        $(_preChild[1]).append("JSON Payload: <br>"+JSON.stringify(_temp, null, " "));
      }
      if($(frm).attr('enctype') == 'multipart/form-data'){
          ajaxOpts.data = new FormData(this);
          ajaxOpts.contentType= false;
          ajaxOpts.enctype= 'multipart/form-data';
          ajaxOpts.processData= false;
      }
      if($('.as-user input[name=asuser]').val())
        ajaxOpts.headers = {'x-user-email':$('.as-user input[name=asuser]').val()}

       if($('#userToken').val() !="")
        ajaxOpts.headers={'x-access-token' :$('#userToken').val()};
        $.ajax(ajaxOpts);
    });
});
}

function stringToBoolean(string){
    switch(string.toLowerCase().trim()){
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": case null: return false;
        default: return Boolean(string);
    }
}
