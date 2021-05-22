 var DEFAULT_ROOM_MSG = 'Please use the [compose message] icon on the top and send your request.';
 var DEFAULT_EMPTY_MSG = 'Nothing yet!!!';
 
 $(document).ready(function(){
	 	
	//initDefultsViews(myTopics, null);
	
	updateScrollBars();
	
	bindTapEvents();
	
		//topic selection
		$(document).on('click', '.left-panes .tab-items > div > li, .left-panes .tab-items > div .accordn-item li', function(){
					var _el = $(this), _topicType = _el.data('type');
					//set active class for tapped item
					$('.left-panes .tab-items > div > li, .left-panes .tab-items > div .accordn-item li').removeClass('active');
					_el.addClass('active');
					
					//hide all right panel cards
					$('#cards>div').addClass('hide');
					 $('.chat-input').hide();
					switch(_topicType){
						case 'topic': switchRoom(_el.data('id'),_el.data('belong')); break;
						case 'root': getTopicDetails(_el.data('id'),''); break;
						case 'orgs': getOrgTopics(_el.data('id'),''); break;
						case 'pending': getPendingTopicChat(_el.data('id'),''); break;
						case 'archive': getArchiveTopicChat(_el.data('id'),_el.data('belong')); break;
					}
		});
	
		$('.left-panes .nav.nav-tabs a').on('click', function(){
            $('.left-panes .nav.nav-tabs li').removeClass('active');
            $(this).parent('li').addClass('active');
       });

		$("[class*='nav-header'] div h4.cursor").on('click', function(){
					$('#cards>div').addClass('hide');
					initDefultsViews(myTopics,null, true);
		});

       $(document).on("click", "#conversation .others b", function(evt){
         var targt = $(evt.target);
         if(targt.length>0){
           var usrNme = targt[0].innerHTML;
           send_individual_msg(usrNme);
         }
       });
        
	 $(document).on('click', ".add-room", function(evt){
          var cls = 'roomInput', orgId = [], orgName='';
            var el = $(this);
            if(el.hasClass('org')){
               if($('input[name=orgids]:checked').length>0){
                    $.each($('input[name=orgids]:checked'), function(ind, el){ orgId.push($(el).val())});
                }else{
                    orgId.push(el.data('orgid'));
                }
              cls = 'orgInput'
              orgId='data-orgid="'+ orgId.join(',') + '"';
              orgName='data-orgname="'+ el.data('orgname') + '"';
            }

            $('.login .form').html(`<h3 class="title">Enter Topic Title</h3>
            <input class="${cls}" type="text" maxlength="14" ${orgId} ${orgName}/><p></p>`);
            $('.login').show();
            $('.login .form input').focus();
        });
		
		$(document).on('click', ".btn.strt-conv", function(evt){
		  $('.chat-input').show();
		});
		
		
		$(document).on("click", ".left-panes .tab-items .info .fa-ellipsis-h", function (event){
			var _el = $(this), pos = _el.position();
			pos.top = pos.top+25;
			pos.left = pos.left-78;
			$("body").append(`<ul href="#" class="up-arrow dialog" style="position:absolute; display:block; top:${pos.top}; left:${pos.left}">
										<li data-topic="${_el.data('topic')}" data-subtopic="${_el.data('subtopic')}" data-action="archive" class="archive">Archive</li>
										<li data-topic="${_el.data('topic')}" data-subtopic="${_el.data('subtopic')}" data-action="delete" class="delete">Delete</li>
									</ul>`);
			 event.stopPropagation();
		});
		
		$(document).on("click", '.up-arrow.dialog li', function(evt){
			var _el = $(this);
			performListActions(_el.data());
			evt.stopPropagation();
		});
		
		$(document).on("click", function(){$('.up-arrow.dialog').remove();});
		
		$(document).on("click", '.x-close', function(){
			clearConversation();
		});
		
		
});

	function collapseItem(id, subTopic){
		var __el= $('[data-target="#'+id+'"]');
		if(__el.length==0) return;
			__el.attr('aria-expanded',true);
			__el.removeClass('collapsed');
			__el.next().addClass('collapse in');
			__el.next().attr('aria-expanded',true);
			$('#'+id+' > li').removeClass('active');
			$('#'+id+' [data-belong="'+subTopic+'"]').addClass('active');
			$('.chat-input').show();
	}

	function updateScrollBars(){
	   var chatElHeight = 187;
	   if($('.chat-input').css('display') == 'none') chatElHeight = 0;
      $('#main').css('height',$( document ).height()-60);
      $('#rooms').css('height',$( document ).height()-120);
      $('#cards').css('height',$( document ).height()-187);
	  if($('#conversation').length>0)
      $('#cards').animate({"scrollTop": $('#conversation')[0].scrollHeight},"slow");

       var _tmp = $( document ).width() - $('.left-panes').width();

      if(_tmp<480)
        $('.right-panes .chat-input').css('width','100%');
      else
      $('.right-panes .chat-input').css('width',($( document ).width() - ($('.left-panes').width())));
	}
	

	function updateAction(type, id, chatid){
		switch(type){
			case 'archive': 
			case 'delete': 
				$('.up-arrow.dialog').remove();
				$('[data-id="'+id+'"][data-belong="'+chatid+'"]').remove();
				$('#conversation #chat-room-'+id+'-'+chatid).html('');
				if(chatid == currentSubTopic){
					setChatHeader('', '');
					$('.right-panes .chat-input').hide();
				}
				break;
		}
	}

    function _getOrgs(callback){
    $.getJSON( "data/organizations.json", function( data ) {
        $('#orgs').html('');
        var membrs = '';
        $.each( data, function( key, val ) {
		  $('#orgs').append(`<div class="accordn collapsed" data-toggle="collapse" data-target="#${val.name.replace(/\s/,'-')}" aria-expanded="false">
			<li class="icon-org">
				<div class="box-start">
						<h6>${val.name}</h6>
						<span>${val.topics.length} converstations</span>
				</div>
				<span class="box-end"><i class="fa-times fa fa-2x pull-right"></i></span>
			</li>
		  </div>`);
		  $('#orgs').append(`<div id="${val.name.replace(/\s/,'-')}" class="accordn-item"></div>`);
		  $.each( val.topics, function( k, v ) {	
		  	//membrs =$.map(val.members, function(k,v){return k.name;}).join(',');
			  $('#orgs #'+val.name.replace(/\s/,'-')).append(`<li class="she">
									  <div class="info"><div class="name">
										<span class="left room-name">${v.name}</span>
										<span class="right time">2:00</span>
									  </div>
									  <div class="people clear">${$.map(v.members, function(k,v){return k.name;}).join(',')}</div>
									  <div class="desc">Lorem ipsum lorm ipsum</div>
									  </div></li>`);
        });//topics loop
		});//org loop
      });
      callback();
    }
		
$( window ).resize(function(){
	updateScrollBars();
});


function bindTapEvents(global){
		var els  = $("[data-target]");
		
		if(global) els  = $(global+" [data-target]");
		
		$.each(els, function(ind, el){
			var _el = $(el), _type = _el.data('type');
			switch(_type){
				case 'toggle': 
					_el.bind('click', function(){
							$(_el.data('target')).toggle();
					});
					break;
				case 'parent-hide':
					_el.bind('click', function(){
						_el.closest('.parent').hide();
					});
					break;
				case 'tabs':
						_el.bind('click', function(){
							clearConversation();
							$('.defaultMsg').hide();
							$(_el.data('hideitems')).addClass('hide');
							$(_el.data('target')).removeClass('hide');
							if(_el.data('target').indexOf('#orgs') != -1){
								getOrgs(function(){});
							}else if(_el.data('target').indexOf('#archive')!= -1){
								getArchiveTopics();
							}else if(_el.data('target').indexOf('#pending')!= -1){
								getPeindingTopics();
							}
					});
					break;
				case 'accordian':
					_el.bind('click', function(){
						getSubTopics(_el.data(), _el.hasClass('orgs')?'orgs':'');
					});	
				break;
				default:
				_el.bind('click', function(){
					$(_el.data('target')).show();
				});	
			}
		});
}



function initDefultsViews(rooms, hist, isBack){
	$("#rooms").removeClass('hide');
	$('.defaultMsg').hide();
	if(rooms.length==0) showEmptyDataInfo()
	if(hist){
		$('.right-panes .chat-input').show();
		$("#conversation").removeClass('hide');
	}
	if(isBack){
		$("[class*='-nav-header']").addClass('hide');
		$("[class*='default-nav-header']").removeClass('hide');
		clearConversation();
		if(rooms.length==0) showEmptyDataInfo()
	}
}
function showEmptyDataInfo(type){
		$('.defaultMsg').text(DEFAULT_ROOM_MSG);
		$('.defaultMsg').show();
		$('#rooms, #orgs, #archive').addClass('hide');
}


function clearConversation(){
	$("#cards>div").addClass('hide');
	$(".right-panes .chat-input").hide();
	$('.conversation-header h5, .conversation-header p').html('');
}



function getOrgTopics(){}
function getPendingTopics(id){
	$('#cards .pending.page').removeClass('hide');
	setChatHeader('topic 3', "");
}

function setChatHeader(heading, members){
	$('.conversation-header h5, .conversation-header p').html('');
	$('.conversation-header h5').html(heading);
	if(members){
		var _mem = (typeof members=='object')?$.map(members, function(member){return member.name;}).join(','):members;
		$('.conversation-header p').html(_mem);
	}
}
function setDefaultMsg(msg, target){
	$('.defaultMsg').html(msg).show();
	$(target).addClass('hide');
}

function serializeFormObj(arrayObj){
	new_obj = {};
	$.each(arrayObj, function(i, obj) { new_obj[obj.name] = obj.value });
	return	new_obj;
}