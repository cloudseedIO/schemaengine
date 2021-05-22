var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var global=require('../../utils/global.js')
var addedfiles=[];
var WebUtils=require('../../utils/WebAPIUtils.js');
function loadjscssfile(filename, filetype,callback){
	var fileref;
	if(addedfiles.indexOf(filename)==-1){
		addedfiles.push(filename);
	    if (filetype=="js"){
	    	fileref=document.createElement('script');
	        fileref.setAttribute("type","text/javascript");
	        fileref.setAttribute("src", filename);
	    } else if (filetype=="css"){
	        fileref=document.createElement("link");
	        fileref.setAttribute("rel", "stylesheet");
	        fileref.setAttribute("type", "text/css");
	        fileref.setAttribute("href", filename);
	    }
	    if (typeof fileref!="undefined"){
	        document.getElementsByTagName("head")[0].appendChild(fileref);
	    }
    }
}
function loadTagsInputResources(){
	loadjscssfile("//cdnjs.cloudflare.com/ajax/libs/bootstrap-tagsinput/0.8.0/bootstrap-tagsinput-typeahead.css","css");
	loadjscssfile("//cdnjs.cloudflare.com/ajax/libs/bootstrap-tagsinput/0.8.0/bootstrap-tagsinput.css","css");
	loadjscssfile("//cdnjs.cloudflare.com/ajax/libs/bootstrap-tagsinput/0.8.0/bootstrap-tagsinput.min.js","js");
	loadjscssfile("//twitter.github.io/typeahead.js/releases/latest/typeahead.bundle.js","js");
}
exports.loadTagsInputResources=loadTagsInputResources;

var TagsInput=React.createClass({
	getInitialState:function(){
		return {defaultValue:this.props.defaultValue?this.props.defaultValue:""}
	},
	componentDidMount:function(){
		var self=this;
		loadTagsInputResources();
		setTimeout(function(){self.init();},2500);
	},
	done:function(){
		this.props.callback($(this.tagsInput).tagsinput('items'));
	},
	init:function(){
		var keywords = new Bloodhound({
  			datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
  			queryTokenizer: Bloodhound.tokenizers.whitespace,
  			prefetch: {
    			url: '/keywords?operation=getKeywords',
    			filter: function(list) {
      				return $.map(list, function(keyword) {
        					return { name: keyword };
        			});
    			}
  			},
  			remote: {
			    url: '/keywords?operation=getKeywords&data={"keyword":"%QUERY"}',
			    wildcard: '%QUERY',
			    filter: function(list) {
      				return $.map(list, function(keyword) {
        					return { name: keyword };
        			});
    			}
			}
		});
		keywords.initialize();
		//$(this.tagsInput).tagsinput('destroy');
		//data-role="tagsinput"
		//this.tagsInput.dataset.role="tagsinput";
		$(this.tagsInput).tagsinput({
	  		typeaheadjs: {
	    		name: 'keywords',
	    		displayKey: 'name',
	    		valueKey: 'name',
	    		source: keywords.ttAdapter()
	  		},
			confirmKeys: [13, 44],
	  		freeInput: false
		});

		$(this.tagsInput).on('itemAdded',this.done);
		$(this.tagsInput).on('itemRemoved',this.done);

	},
	createKeyword:function(){
		var node = document.createElement("div");
		node.id = global.guid();
		var popUpId = global.guid();
		var contentDivId = global.guid();
		var sideDivId = global.guid();
		node.className = "smallDialogBox";
	    //node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	    ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} noSideDiv={true}/>,node);
	    ReactDOM.render(<CreateKeyword/>,document.getElementById(contentDivId));
	},
	render:function(){
		return (<div className="">
			<input  defaultValue={this.state.defaultValue} ref={(e)=>{this.tagsInput=e}}/>
			{(common.isAdmin())?(<span className="link extra-padding-left" onClick={this.createKeyword}>Add New Keywords</span>):("")}
		</div>)
	}
});
exports.TagsInput=TagsInput;
var CreateKeyword=React.createClass({
	componentDidMount:function(){
		this.text.focus();
	},
	sendKeyword:function(event){
		var self=this;
		var code=event.keyCode? event.keyCode:event.which;
		if(code==13){
			var text=this.text.value.trim();
			if(text!=""){
				WebUtils.doPost("/keywords?operation=saveKeyword",{keyword:text},function(data){
					alert("'"+text+"' Added to keywords list");
					self.text.value="";
					self.text.focus();
				});
			}
		}
	},
	render:function(){
		return <div>
			<input type="text" id="tagsInput" ref={(e)=>{this.text=e}} onKeyPress={this.sendKeyword} className="form-control"/>
			<span>Press enter to create keyword</span>
			</div>
	}
});










if(typeof window != "undefined"){
	window.loadTagsInput=function(){
		ReactDOM.render(<TagsInput/>,document.getElementById("dynamicContentDiv"));
	}
}
