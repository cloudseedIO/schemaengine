'use strict';
var React=require("react");
var ReactDOM = require("react-dom");
var ShortDetailsStore = require('../stores/ShortDetailsStore.js');

var endPoints=require('../endPoints.js');
var SERVER_URL=endPoints.chatServerAddress || "https://localhost:3000";

//var linkGenerator=require('./nav/linkGenerator.jsx');
var socket;
var manageRecords=require('./records/manageRecords.jsx');
var common=require('./common.jsx');
var genericView=require('./view/genericView.jsx');
var global=require('../utils/global.js');
var WebAPIUtils =require('../utils/WebAPIUtils.js');
function initChat(){
	try{
		//SERVER_URL=common.getConfigDetails().chat_api.client_domain;
	}catch(err){}
	if(typeof io !="undefined"){
		socket = io.connect(SERVER_URL);
		socket.on("update_org_details",function(data){
			ShortDetailsStore.receiveShortDetails(data);
		});
		socket.on("update_user_details",function(data){
			ShortDetailsStore.receiveShortDetails(data);
		});

		socket.on('update_all_my_notfications_count', function(res){
			var allNotificationsCount=0;
			try{
				allNotificationsCount=res.results[0].count;
			}catch(err){
				allNotificationsCount=0;
			}
			ShortDetailsStore.receiveShortDetails({recordId:"allNotificationsCount",count:allNotificationsCount});
		});
	}
}
exports.initChat=initChat;

function timeFormat(dateString){
	try{
		var year=dateString.split(" ")[0].split("/")[2];
		var month=dateString.split(" ")[0].split("/")[1]-1;
		var date=dateString.split(" ")[0].split("/")[0];
		var hours=dateString.split(" ")[1].split(":")[0];
		var minutes=dateString.split(" ")[1].split(":")[1];
		var seconds=0;
		if(year.length==2 && date.length==4){
			var temp=date;
			date=year;
			year=temp;
		}
		try{
			seconds=dateString.split(" ")[1].split(":")[2];
		}catch(err){}

		var date1=new Date(year, month, date, hours?hours:0, minutes?minutes:0, seconds?seconds:0);


		date1.setMinutes ( date1.getMinutes() - (date1.getTimezoneOffset()+330));


		var d = date1.getDate();
		var M = date1.getMonth()+1; //January is 0!
		var h = date1.getHours();
		var m=date1.getMinutes();
		var yyyy = date1.getFullYear();
		//var s =date1.getSeconds();
		var newdate = d + "/" + M + "/" + yyyy;
		var time = h + ":" + m;
	    if ((new Date() - date1 )<=172800000){
	    	if((new Date().getDate()- d)== 1){
	    		return "Yesterday";
	    	}else if(new Date().getMinutes() - m ==0){
	    		return "Just Now";
	    	}else{
				return time;
			}
        }else{
        	return newdate;
        }
		//return newdate+" "+time;

		//return date1.toString().substr(0,24);


	}catch(err){
		return dateString;
	}
}
/*function downloadBlob(data, fileName, mimeType) {
	var blob, url;
	blob = new Blob([data], {
	  type: mimeType
	});
	url = window.URL.createObjectURL(blob);
	downloadURL(url, fileName, mimeType);
	setTimeout(function() {
	  return window.URL.revokeObjectURL(url);
	}, 1000);
};
function downloadURL(data, fileName) {
	var a;
	a = document.createElement('a');
	a.href = data;
	a.download = fileName;
	document.body.appendChild(a);
	a.style = 'display: none';
	a.click();
	a.remove();
}*/
function getCloudinaryImage(imageArray){
	var img="//res.cloudinary.com/dzd0mlvkl/image//upload/h_150,w_150/v1426847732/default-user.jpg";
	if(Array.isArray(imageArray) && imageArray.length>0){
		if(imageArray[0].cloudinaryId && imageArray[0].cloudinaryId!=""){
			if((imageArray[0].cloudinaryId).indexOf("http")!=-1){
				img=imageArray[0].cloudinaryId;
			}else{
				img="//res.cloudinary.com/dzd0mlvkl/image/upload/h_150,w_150/v1441279368/"+imageArray[0].cloudinaryId+".jpg";
			}
		}else{
			if(imageArray[0].facebook ){
				img="//res.cloudinary.com/dzd0mlvkl/image/facebook/h_150,w_150/"+imageArray[0].facebook+".jpg";
			}else if(imageArray[0].google ){
				img="//res.cloudinary.com/dzd0mlvkl/image/gplus/h_150,w_150/"+imageArray[0].google+".jpg";
			}
		}
	}
	return img;
}
class IconName extends React.Component {
	constructor(props) {
		super(props);
		this.state=this.getStateFromProps(props);
		this._onChange=this._onChange.bind(this);
	}
	getStateFromProps(props){
		//return {id:props.id,details:{}};
		return {id:props.id,details:ShortDetailsStore.get(props.id)};
	}
	_onChange(){
		this.setState({details:ShortDetailsStore.get(this.state.id)});
	}
	componentWillReceiveProps(nextProps){
		if(this.props.id!=nextProps.id)
		this.setState(this.getStateFromProps(nextProps));
	}
	componentWillUnmount() {
		ShortDetailsStore.removeChangeListener(this._onChange,this.state.id);
  	}
	componentDidMount(){
		if(!this.state.details){
			if(this.props.type=="org"){
				socket.emit("get_org_details",this.state.id);
			}else{
				socket.emit("get_user_details",this.state.id);
			}
		   	ShortDetailsStore.addChangeListener(this._onChange,this.state.id);
		}
	}
	render(){
		var image="";
		var name="";
		if(!this.state.details){
			return <div/>
		}
		if(this.props.type=="org"){
			image=getCloudinaryImage(this.state.details.profileImage);
			name=this.state.details.name;
		}else{
			image=getCloudinaryImage(this.state.details.image);
			name=(this.state.details.givenName+" "+(this.state.details.familyName?this.state.details.familyName:"")).trim();
		}
		if(!name){
			name="";
		}
		if(this.props.hideImage){
			return (<div style={this.props.style?this.props.style:{}}>
						{name}
					</div>)
		}else if(this.props.showImage){
			return (<div>
						<img src={image} className=" img-circle profilePhoto pull-left img-holder"/>
					</div>)
		}else{
			return <div className={"display-inline-block "+(this.props.noFormGroup?"":"form-group")}>
						<div className="parent-img-component userIcon-height" style={{"maxWidth":"150px"}}>
							<div className="child-img-component">
								<img src={image} className=" img-circle profilePhoto pull-left img-holder"/>
							</div>
							<div className={"link child-img-component text-wrap"}>
								<span className="userName">{name}</span>
							</div>
						</div>
					</div>
		}
	}
}
exports.IconName=IconName;
class ChatComponent extends React.Component{
	constructor(props) {
		super(props);
		this.state={
			composeMode:props.composeMode?true:false,
			userId:undefined,
			currentView:"topicsAndChats",				//topicsAndChats|compose|topics|orgs|pending|archivedChats|archivedTopics
			composeData:{type:props.type,id:props.id},
			currentTopic:undefined,
			currentTopicDetails:undefined,
			currentOrg:undefined,
			currentChat:undefined,
			currentChatDetails:undefined,
			topics:[],
			orgs:[],
			chats:[],
			topicsAndChats:[],
			searchText:""
		};
		this.setCurrentView=this.setCurrentView.bind(this);
		this.setSortOption=this.setSortOption.bind(this);
		this.performSocketRegistrations=this.performSocketRegistrations.bind(this);
		this.setCurrent=this.setCurrent.bind(this);
		this.resetCounters=this.resetCounters.bind(this);
		this.removeFromCurrentView=this.removeFromCurrentView.bind(this);
		this.searchTextUpdated=this.searchTextUpdated.bind(this);
		this.setNewCurrentTopic=this.setNewCurrentTopic.bind(this);
		this.allMessages=this.allMessages.bind(this);
		this.backMessage=this.backMessage.bind(this);
		this.toggleDivs=this.toggleDivs.bind(this);
	}
	componentDidMount(){
		var self=this;
		document.getElementById("topNav").className+=" hidden";
		if(this.props.userId){
			this.setState({userId:this.props.userId},function(){
				self.performSocketRegistrations();
				self.calculateHeight();
			});
		}else{
			//var id=prompt("Enter your Id   User2cc75dc3-44b0-45c3-4532-a20724a73dc5   UserFBEye     User7576f075-4f7b-f647-b776-bb0034ed0ecb");
			//this.setState({userId:id?id:"User2cc75dc3-44b0-45c3-4532-a20724a73dc5"},this.performSocketRegistrations);
		}
		try{guide("Guide-Messaging");}catch(err){}
	}
	componentDidUpdate(){
		if(document.getElementById("topicsView")){
			this.calculateHeight();
		}
		if(this.searchText && !this.state.currentChat && !this.props.mobile && !this.state.composeMode)
		this.searchText.focus();
	}
	calculateHeight(){
		if(window){
			var height=(this.props.mobile)?(window.innerHeight-80):window.innerHeight;

			if(document.getElementById("chatSideNavs") && document.getElementById("chatSideNavs").clientHeight>0){
				height=height-document.getElementById("chatSideNavs").clientHeight;
			}
			if(document.getElementById("chatSideSearch") && document.getElementById("chatSideSearch").clientHeight>0){
				height=height-document.getElementById("chatSideSearch").clientHeight;
			}
			if(document.getElementById("chatSideHeader") && document.getElementById("chatSideHeader").clientHeight>0){
				height=height-document.getElementById("chatSideHeader").clientHeight;
			}
			if(document.getElementById("topicsView")){
				document.getElementById("topicsView").style="height:"+height+"px";
			}
		}
	}
	performSocketRegistrations(){
		var self=this;
		socket.emit('adduser', this.state.userId);
		socket.emit('get_my_topics_and_chats',this.state.userId);

		/*socket.on('update_my_chat_notifications', function (notifications,userId) {
			self.setState({notifications:notifications.results});
		});*/


		socket.on('update_my_topics_and_chats', function(res) {
			self.setState({topicsAndChats:res.results,currentView:"topicsAndChats"});
		});

		//autoSwitch is when server adds members of an organization to a room
		socket.on('update_my_topics', function(topics) {
			self.setState({topics:topics.results,currentView:"topics"});
		});
		socket.on('update_topic_details', function (topic,topicId,userId) {
			self.setState({currentTopicDetails:topic});
		});
		socket.on('update_chat_details', function (chat, topic, userId, belongTo) {
			self.setState({currentChatDetails:chat});
		});
		socket.on('new_topic',function(topic){
			var state=self.state;
			if(topic.userId==self.state.userId){
				state=Object.assign(state,{
					currentTopic:topic.id,
					currentTopicDetails:topic,
					composeMode:false,
					currentChat:undefined,
					currentChatDetails:undefined
				});
			}
			var topicsAndChats=self.state.topicsAndChats;
			var isNew=true;
			for(var index=0;index<topicsAndChats.length;index++){
				if(topicsAndChats[index].id==topic.id){
					isNew=false;
					break;
				}
			}
			if(isNew){
				topicsAndChats=[topic].concat(topicsAndChats);
				state=Object.assign(state,{topicsAndChats:topicsAndChats,currentView:"topicsAndChats"});
			}
			self.setState(state);
		});
		socket.on('new_chat',function(chat,sender){
			common.stopLoader();
			//checking for new message in chat
			var index;
			var topicsAndChats=undefined;
			var chatIndex;
			if(self.state.currentChat==chat.id){
				self.setState({currentChatDetails:chat});
			}else if(sender==self.state.userId){//current user created the chat
				topicsAndChats=self.state.topicsAndChats;

				for(index=0;index<topicsAndChats.length;index++){
					if(topicsAndChats[index].id==chat.id){
						chatIndex=index;
						break;
					}
				}
				if(chatIndex!=undefined){
					topicsAndChats.splice(chatIndex,1);
				}
				topicsAndChats=[chat].concat(topicsAndChats);

				var topicIndex;
				for(index=0;index<topicsAndChats.length;index++){
					if(topicsAndChats[index].id==chat.topicId){
						topicIndex=index;
						break;
					}
				}
				if(topicIndex){
					topicsAndChats.splice(topicIndex,1);
				}


				self.setState({
					currentChat:chat.id,
					currentChatDetails:chat,
					topicsAndChats:topicsAndChats,
					currentView:"topicsAndChats"
				});
			}else{//current user received the chat
				topicsAndChats=self.state.topicsAndChats;
				for(index=0;index<topicsAndChats.length;index++){
					if(topicsAndChats[index].id==chat.id){
						chatIndex=index;
						break;
					}
				}
				if(chatIndex!=undefined){
					topicsAndChats.splice(chatIndex,1);
				}
				topicsAndChats=[chat].concat(topicsAndChats);
				self.setState({topicsAndChats:topicsAndChats,currentView:"topicsAndChats"});
			}
		});

		socket.on('get_orgs', function(topics){
			self.setState({orgs:topics.results,currentView:"orgs",chats:[]});
		});

		socket.on('get_pending_topics', function(topics){
			self.setState({topics:topics.results,currentView:"pending"});
		});

		socket.on('get_archived_chats', function(topics){
			self.setState({chats:topics.results,currentView:"archivedChats"});
		});
		socket.on('get_archived_topics', function(res){
			self.setState({topics:res.results,currentView:"archivedTopics"});
		});
		socket.on('get_subchats', function(data,belongTo,type){
				self.setState({chats:data.results});//,currentView:"orgs"
			/*if(type=="org"){
				self.setState({chats:data.results});//,currentView:"orgs"
			}else{
				self.setState({chats:data.results});//,currentView:"topics"
			}*/
		});
		//send files
		//get topic level notifications
		//socket.emit('get_my_chat_notifications',this.state.userId);


		socket.on('update_chat_delete', function(id, userId) {
			self.removeFromCurrentView(id);
		});

		socket.on('update_chat_archive', function(id,userId) {
			self.removeFromCurrentView(id);
		});

		socket.on('update_chat_un_archive', function(id,userId) {
			self.removeFromCurrentView(id);
		});
		socket.on('update_topic_delete', function(id, userId) {
			self.removeFromCurrentView(id);
		});

		socket.on('update_topic_archive', function(id,userId) {
			self.removeFromCurrentView(id);
		});

		socket.on('update_topic_un_archive', function(id,userId) {
			self.removeFromCurrentView(id);
		});
	}
	setNewCurrentTopic(topic){
		//this.setCurrent(topic.id,"topic",topic);
		//this.setCurrentView("topics");
		this.setState({
			currentTopic:topic.id,
			currentTopicDetails:topic,
			currentChat:undefined,
			currentChatDetails:undefined,
			composeMode:false
		});
	}
	removeFromCurrentView(id){
		var topicsAndChats=this.state.topicsAndChats;
		var chats=this.state.chats;
		var topics=this.state.topics;
		var topicsAndChatsIndex;
		var chatIndex;
		var topicIndex;
		var index;

		for(index=0;index<topicsAndChats.length;index++){
			if(topicsAndChats[index].id==id){
				topicsAndChatsIndex=index;
				break;
			}
		}
		for(index=0;index<chats.length;index++){
			if(chats[index].id==id){
				chatIndex=index;
				break;
			}
		}
		for(index=0;index<topics.length;index++){
			if(topics[index].id==id){
				topicIndex=index;
				break;
			}
		}
		if(topicsAndChatsIndex!=undefined){
			topicsAndChats.splice(topicsAndChatsIndex,1);
		}
		if(chatIndex!=undefined){
			chats.splice(chatIndex,1);
		}
		if(topicIndex!=undefined){
			topics.splice(topicIndex,1);
		}
		this.setState({
			topicsAndChats:topicsAndChats,
			topics:topics,
			chats:chats
		});
	}
	searchTextUpdated(){
		this.setCurrentView(this.state.currentView);
	}
	setCurrentView(mode){
		var searchText=this.searchText?this.searchText.value.trim():"";
		if(mode=="orgs"){
			socket.emit('get_orgs', this.state.userId);
		}else if(mode=="archivedChats"){
			socket.emit('get_archived_chats', this.state.userId,searchText);
		}else if(mode=="archivedTopics"){
			socket.emit('get_archived_topics', this.state.userId,searchText);
		}else if(mode=="pending"){
			socket.emit('get_pending_topics', this.state.userId,searchText);
		}else if(mode=="topics"){
			socket.emit('update_my_topics', this.state.userId,searchText);
		}else if(mode!="compose"){
			socket.emit('get_my_topics_and_chats',this.state.userId,searchText);
		}
		if(this.state.currentView!=mode){
			searchText="";
		}
		if(mode=="compose"){
			this.setState({composeMode:true});
			try{trackThis("chat",{type:"compose",id:this.state.userId});}catch(err){}
		}else{
			this.setState({
				currentView:mode?mode:"topicsAndChats",
				topics:[],
				chats:[],
				currentChat:undefined,
				currentChatDetails:undefined,
				currentTopic:undefined,
				currentTopicDetails:undefined,
				currentOrg:undefined,
				searchText:searchText,
				composeMode:this.state.composeMode
			});
		}
	}
	setSortOption(opt){
		this.setState({sortOption:opt});
	}
	toggleDivs(){
		if(this.props.mobile){
			document.getElementById("chatSideDiv").className+=" hideChatSideDiv";
			document.getElementById("chatSideHeader").className+=" hideChatSideDiv";
			document.getElementById("chatContentDiv").className=document.getElementById("chatContentDiv").className.replace(/hideChatContentDiv/g,"");
		}
	}
	setCurrent(id,type,doc){
		this.resetCounters(id,function(){
			if(type=="topic"){
				this.setState({
					currentTopic:id,
					currentTopicDetails:doc,
					chats:[],
					currentChat:undefined,
					currentChatDetails:undefined,
					composeMode:false
				});
				socket.emit('switchToTopic',this.state.userId,id);
				if(this.state.currentView!="pending")
				socket.emit('get_subchats',this.state.userId, id,type);
			}else if(type=="org"){
				this.setState({currentOrg:id,chats:[]});
				socket.emit('get_subchats',this.state.userId, id,type);
			}else if(type=="chat"){
				this.toggleDivs();
				this.setState({
					currentChat:id,
					currentChatDetails:doc,
					currentTopic:undefined,
					currentTopicDetails:undefined,
					composeMode:false
				});
				socket.emit('switchToChat',this.state.userId, id);
			}
		}.bind(this));
	}
	resetCounters(id,callback){
		var chats=this.state.chats;
		for(var i=0;i<chats.length;i++){
			if(chats[i].id==id){
				try{
					ShortDetailsStore.reduceNotificationsCount({recordId:"allNotificationsCount",count:chats[i].counter[this.state.userId].count});
					chats[i].counter[this.state.userId].count=0;
				}catch(err){}
				break;
			}
		}
		var topics=this.state.topics;
		for(var i=0;i<topics.length;i++){
			if(topics[i].id==id){
				try{
					ShortDetailsStore.reduceNotificationsCount({recordId:"allNotificationsCount",count:topics[i].counter[this.state.userId].count});
					topics[i].counter[this.state.userId].count=0;
				}catch(err){}
				break;
			}
		}
		var topicsAndChats=this.state.topicsAndChats;
		for(var i=0;i<topicsAndChats.length;i++){
			if(topicsAndChats[i].id==id){
				try{
					ShortDetailsStore.reduceNotificationsCount({recordId:"allNotificationsCount",count:topicsAndChats[i].counter[this.state.userId].count});
					topicsAndChats[i].counter[this.state.userId].count=0;
				}catch(err){}
				break;
			}
		}
		this.setState({chats:chats,topics:topics,topicsAndChats:topicsAndChats},callback)
	}
	allMessages(){
		document.getElementById("chatContentDiv").className+=" hideChatContentDiv"
		document.getElementById("chatSideDiv").className=document.getElementById("chatSideDiv").className.replace(/hideChatSideDiv/g,"");
		document.getElementById("chatSideHeader").className=document.getElementById("chatSideHeader").className.replace(/hideChatSideDiv/g,"");
		this.calculateHeight();
	}
	backMessage(){
		if(this.props.mobile)
			return (<div className="backLink pointer" style={{"fontWeight":"600"}} onClick={this.allMessages}>
						<i className="icons8-left-arrow-2 ">
					 	</i>
					 	<span>{" All Messages"}</span>
					 </div>)
		else{
			return (<div className="hidden"></div>)
		}
	}
	render(){
	//	var self=this;
		var showComposeButton=false;
		var scmaRole=common.getSchemaRoleOnOrg("Product","public");
		if(scmaRole && scmaRole.methods && (scmaRole.methods=="all" || scmaRole.methods.indexOf("@chat")>-1)){
			showComposeButton=true;
		}
		return (<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
			{/*{
			(this.state.currentView=="compose")?(
				<ComposeChat
					userId={this.state.userId}
					setCurrentView={this.setCurrentView}
					composeData={this.state.composeData}/>
			):(*/}
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
					<div id="chatSideDiv" className="col-lg-3 col-md-3 col-sm-6 col-xs-12  no-padding border-right">
						<div id="chatSideHeader" className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right add-border-bottom-pin  no-padding-left extra-padding-bottomextra-padding-top-md chatHeaderHeight">
							<div className="parent-img-component col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
								<div className="child-img-component ">
									<div className={this.state.currentView=="topicsAndChats"?"default-nav-header h2 no-padding no-margin":"extra-padding-left"}>
										{
											(this.state.currentView=="topicsAndChats")?(<span className="extra-padding-left">Messages</span>):
											(<div className="backLink pointer" style={{"fontWeight":"600"}} onClick={this.setCurrentView.bind(null,"topicsAndChats")}>
												<i className="icons8-left-arrow-2 ">
											 	</i>
											 	<span>Messages</span>
											 </div>)
										}

									</div>
									<div className={this.state.currentView=="topicsAndChats"?"hidden":"default-nav-header extra-padding-left"}>
											{
												this.state.currentView=="orgs"?"My Orgs":(
													this.state.currentView=="pending"?"Pending":(
														this.state.currentView=="archivedChats"?"Archived Chats":(
															this.state.currentView=="archivedTopics"?"Archived Topics":(
																this.state.currentView=="topics"?"Topics":""
															)
														)
													)
												)
											}
									</div>
								</div>
								{(showComposeButton)?(
								<div className="child-img-component no-padding pull-right">
									 <div className="buttonWidth" title={"Create New Topic"}>
	                                    <span onClick={this.setCurrentView.bind(null,"compose")}>
	                                            <div className="">
	                                                <i style={{"fontSize":"30px"}} className={"icons8-new-message-2 newCustomIcon"} />
	                                             </div>
	                                            <div className="newCustomButton" style={{"display":"block","fontSize":"8px"}}>
	                                                 {"COMPOSE"}
	                                            </div>
	                                     </span>
	                                </div>
								</div>):""}
							</div>
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 noMinWidth hidden">
							{this.state.userId?<IconName type="user" id={this.state.userId}/>:""}
						</div>

						<div id="chatSideNavs" className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right extra-padding-bottom extra-padding-top add-border-bottom-pin "+(this.state.currentView=="topicsAndChats"?"":"hidden") }>
							<div className="col-lg-3 col-md-3 col-sm-3 col-xs-3 no-padding text-left" onClick={this.setCurrentView.bind(null,"topics")}>
								<span className="backLink pointer">My Topics</span>
							</div>
							<div className="col-lg-3 col-md-3 col-sm-3 col-xs-3 no-padding text-left" onClick={this.setCurrentView.bind(null,"orgs")}>
								<span className="backLink pointer">My Orgs</span>
							</div>
							<div className="col-lg-3 col-md-3 col-sm-3 col-xs-3 no-padding text-left" onClick={this.setCurrentView.bind(null,"pending")}>
								<span className="backLink pointer">Pending</span>
							</div>
							<div className="col-lg-3 col-md-3 col-sm-3 col-xs-3 no-padding-left text-right">
								<div className="userNavHover chat" style={{"position":"relative"}}>
								   <a data-toggle="dropdown" className="dropdown-toggle" aria-expanded="false" >
									  <span className="backLink pointer">Archived</span>
								   </a>
	    		                   <ul style={{"minWidth": "65px","left":"14%","fontSize": "12px","marginTop":"5px"}}  className="dropdown-menu arrow_box remove-margin-left noMinWidth remove-margin-right">
                                        <li className="pointer" style={{"padding":"5px","borderBottom":"1px solid lightgrey"}} onClick={this.setCurrentView.bind(null,"archivedTopics","topics")}>Topics</li>
								    	<li className="pointer" style={{"padding":"5px"}} onClick={this.setCurrentView.bind(null,"archivedChats","chats")}>Chats</li>
	                               </ul>
								</div>
							</div>
						</div>
						<div id="chatSideSearch" className="col-lg-12 col-md-12 col-sm-12 col-xs-12 graybackground2  searchPadding">
							 {
							 	this.state.currentView!="orgs"?<div className="searchPosition searchPositionChat">
						    						<input type='text' ref={(e)=>{this.searchText=e}} defaultValue={this.state.searchText} className="form-control borderSearch"  placeholder={"Search"} onChange={this.searchTextUpdated}/>
						    						<span className="icons8-search-filled pointer filterSearch" />
												</div>:""
							}
						</div>
						<div id="topicsView" className="tab-items col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding sideNavHeight">
							<TopicsView userId={this.state.userId}
									currentView={this.state.currentView}
									currentTopic={this.state.currentTopic}
									mobile={this.props.mobile}
									toggleDivs={this.toggleDivs}
									currentOrg={this.state.currentOrg}
									currentChat={this.state.currentChat}
									topicsAndChats={this.state.topicsAndChats}
									topics={this.state.topics}
									orgs={this.state.orgs}
									chats={this.state.chats}
									setCurrent={this.setCurrent}/>
						</div>

					</div>

					<div id="chatContentDiv" className="col-lg-9 col-md-9 col-sm-6 col-xs-12 no-padding-right hideChatContentDiv">
					{
						this.state.composeMode?
							<ComposeChat
								mobile={this.props.mobile}
								userId={this.state.userId}
								setCurrentView={this.setCurrentView}
								composeData={this.state.composeData}
								backMessage={this.backMessage}
								setNewCurrentTopic={this.setNewCurrentTopic}/>:
						this.state.currentChat!=undefined?
							<ChatView
								mobile={this.props.mobile}
								userId={this.state.userId}
								currentChat={this.state.currentChat}
								currentChatDetails={this.state.currentChatDetails}
								backMessage={this.backMessage}
								setCurrent={this.setCurrent}/>
						:this.state.currentTopic!=undefined?
							<TopicView
								mobile={this.props.mobile}
								userId={this.state.userId}
								backMessage={this.backMessage}
								currentTopic={this.state.currentTopic}
								currentTopicDetails={this.state.currentTopicDetails}/>
						:(<div className="row">
							<div id="chatHeading" className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right no-padding-left parent-img-component graybackground chatHeaderHeight">
							</div>
						</div>)
					}
					</div>
				</div>
			{/*)
		}*/}
		</div>)
	}
}



class ComposeChat extends React.Component{
	constructor(props) {
		super(props);
		var manufacturer;
		var supplier;
		var product;
		var spec_item;
		var spec_category;
		if(props.composeData){
			manufacturer=props.composeData.type=="Manufacturer"?props.composeData.id:undefined;
			supplier=props.composeData.type=="Supplier"?props.composeData.id:undefined;
			product=props.composeData.type=="Product"?props.composeData.id:undefined;
			spec_item=props.composeData.type=="SpecListProductCategoryProduct"?props.composeData.id:undefined;
			spec_category=props.composeData.type=="SpecListProductCategory"?props.composeData.id:undefined;
		}
		this.state={
			manufacturer:manufacturer,
			supplier:supplier,
			product:product,
			spec_item:spec_item,
			spec_category:spec_category
		};
		this.submitBroadCastMessage=this.submitBroadCastMessage.bind(this);
		this.setPropertyValue=this.setPropertyValue.bind(this);
		this.showError=this.showError.bind(this);
	}
	setPropertyValue(key,value){
		var state=this.state;
		state[key]=value;
		try{if(!$("#"+key+"InCompleteError").hasClass("hidden")){$("#"+key+"InCompleteError").addClass("hidden");}}catch(err){}
		this.setState(state);
	}
	showError(key){
		try{
			$('html, body,.lookUpDialogBox,#topicContent').animate({
	    		scrollTop: $("#"+key).offset().top-60
			},0);
		}catch(err){}
        try{$("#"+"topicContent"+" "+"#"+key+"InCompleteError").removeClass("hidden");}catch(err){}
	}
	submitBroadCastMessage(){
		var formData = {
			id:"Topic"+global.guid(),
			topic:this.topic.value.trim(),
			message:this.message.value.trim(),
			project:this.project.value.trim(),
			locationNeeded:this.state.locationNeeded//,
			//quantity:this.quantity.value.trim()
		};
		for(var key in this.state){
			formData[key]=this.state[key];
		}
		if(!formData.topic){
			//alert("Please enter topic heading");
			this.showError("topic");
			return;
		}else{
			try{if(!$("#"+"topic"+"InCompleteError").hasClass("hidden")){$("#"+"topic"+"InCompleteError").addClass("hidden");}}catch(err){}
		}
		if(!formData.category){
			//alert("Please choose a product category");
			this.showError("category");
			return;
		}
		if(!formData.locationNeeded){
			//alert("Please fill location needed");
			this.showError("locationNeeded");
			return;
		}

		if(typeof formData.locationNeeded=="object"){
			if(!formData.locationNeeded.locationName){
				common.createAlert("In complete","Please enter location name");
				return;
			}
			if(isNaN(formData.locationNeeded.latitude) ||
				isNaN(formData.locationNeeded.longitude)){
				common.createAlert("In complete","Please choose valid location");
				return;
			}
		}

		formData.createdDate = global.getDate();
		formData.updatedDate = global.getDate();
		formData.userId = this.props.userId;
		formData.type = 'Topic';

		this.sendButton.disabled=true;
		socket.emit('message_to_members',this.props.userId,formData);
		this.props.setNewCurrentTopic(formData);

	}
	calculateHeight(){
		if(window){
			var height=(this.props.mobile)?(window.innerHeight-50):window.innerHeight;
			/*if(document.getElementById("chatSideHeader") && document.getElementById("chatSideHeader").clientHeight>0){
				height=height-document.getElementById("chatSideHeader").clientHeight;
			}*/
			if(document.getElementById("topicContent")){
				document.getElementById("topicContent").style="height:"+height+"px";
			}
		}
	}
	componentDidUpdate(){
		this.calculateHeight();
	}
	componentDidMount(){
		if(this.state.product){
			socket.emit("get_product_details",this.state.product);
			socket.on("update_product_details",function(product){
				 this.setState({topic:product.name,category:product.productCategory,manufacturer:product.Manufacturer});
				 try{this.topic.value=product.name;}catch(err){}
			}.bind(this));
		}
		if(this.props.mobile){
			document.getElementById("chatSideDiv").className+=" hideChatSideDiv";
			document.getElementById("chatSideHeader").className+=" hideChatSideDiv";
			document.getElementById("chatContentDiv").className=document.getElementById("chatContentDiv").className.replace(/hideChatContentDiv/g,"");
		}
		if(this.state.spec_item || this.state.spec_category){
			socket.emit("get_spec_item_details",this.state.spec_item||this.state.spec_category);
			socket.on("update_spec_item_details",function(spec_item){
				//socket.emit("get_product_details",product.Product);
				this.setState({
					product:spec_item.Product,
					manufacturer:spec_item.Manufacturer,
					category:spec_item.ProductCategory,
					architect:spec_item.architectFirm,
					project:spec_item.org
				});
			}.bind(this));
		}
		this.calculateHeight();
	}
	render(){
		var self=this;
		return (
			<div className="parent contentNavHeight" id="topicContent">
					{this.props.backMessage()}
					<div  className="row no-margin">
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
							<h2>New Topic</h2>
						</div>
					</div>
					<div  className="col-lg-12 col-md-12 col-sm-12 col-xs-12 col-lg-12 no-padding-left extra-padding-right-lg">
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
							{
								this.state.supplier?<IconName type="org" id={this.state.supplier}/>:""
							}
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
							{
								this.state.product?<common.UserIcon id={this.state.product} rootSchema="Product" org="public"/>:""
							}
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right">
								<span className="extra-padding-right"><span id={"topic"+"InCompleteError"} className="errorMsg hidden">{"Please enter topic heading"}</span></span>
								<input maxLength="61"
										id="topic"
										type="text"
										className="form-control"
										ref={(e)=>{this.topic=e}}
										placeholder="Enter Topic Heading"/>
							</div>
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right">
								<span className="extra-padding-right"><span id={"message"+"InCompleteError"} className="errorMsg hidden">{""}</span></span>
								<input type="text"
										id="message"
										className="form-control"
										ref={(e)=>{this.message=e}}
										placeholder="Message (optional)"/>
							</div>
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right">
								<span className="extra-padding-right"><span id={"project"+"InCompleteError"} className="errorMsg hidden">{""}</span></span>
								<input type="text"
										id="message"
										className="form-control"
										ref={(e)=>{this.project=e}}
										placeholder="Project name"/>
							</div>
						</div>

						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<manageRecords.DataTypeDelegator key={global.guid()}
									innerComponent={true}
							        noDisplayName={true}
									org={"public"}
									propertyName={"category"}
								    property={{
									      "description": "Product Category",
									      "inCompleteErrorMessage":"Please choose a product category",
									      "displayName": "Product Category",
									      "prompt": "Select Product Category",
									      "itemProp": "",
									       "dataType": {
									        "type": "object",
									        "objRef": "ProductCategory",
									        "refKey": "recordId",
									        "refType": "ajax"
									      },
									      "dataTypebkp": {
									        "type": "object",
									        "objRef": "MfrProCat",
									        "refKey": "ProductCategory",
									        "refKeyType":"object",
									        "refKeyObjRef":"ProductCategory",
									        "refType": "ajax",
									         "filters": {
									          "Manufacturer": [
									            "this.manufacturer"
									          ]
									        }
									      },
									      "required": true
									    }}
								    defaultValue={this.state.category}
								    permission={"edit"}
								    setPropertyValue={this.setPropertyValue}
								    getCurrentDoc={function(){return self.state}}/>
							</div>
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<manageRecords.DataTypeDelegator key={global.guid()}
									innerComponent={true}
							        noDisplayName={true}
									org={"public"}
									propertyName={"manufacturer"}
								    property={{
									      "description": "Manufacturer",
									      "displayName": "Manufacturer",
									      "prompt": "Select Manufacturer (optional)",
									      "itemProp": "brand",
									      "dataType": {
									        "type": "object",
									        "objRef": "MfrProCat",
									        "refKey": "Manufacturer",
									        "refKeyType": "object",
									        "refKeyObjRef": "Manufacturer",
									        "lookupViewName": "mfrView",
									        "refType": "ajax",
									        "filters": {
									          "ProductCategory": [
									            "this.category"
									          ]
									        },
									        "dependentOn":"category"
									      }
									    }}
								    defaultValue={this.state.manufacturer}
								    permission={"edit"}
								    setPropertyValue={this.setPropertyValue}
								    getCurrentDoc={function(){return self.state}}/>
							</div>
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-top-gap"> Location Needed </div>
							<div className="col-lg-5 col-md-5 col-sm-6 col-xs-8 no-padding-right">
								<manageRecords.DataTypeDelegator key={global.guid()}
									innerComponent={true}
							        noDisplayName={true}
									org={"public"}
									propertyName={"locationNeeded"}
								    property={{
									       "description": "Location needed",
									       "inCompleteErrorMessage":"Please fill the location needed",
									      "displayName": "Location",
									      "itemProp": "city",
									      "promptName": "Select city",
									      "dataType": {
									        "type": "geoLocation",
									        "length": "",
									        "helpText": ""
									      },
									      "required": true
									    }}
								    defaultValue={this.state.locationNeeded}
								    permission={"edit"}
								    setPropertyValue={this.setPropertyValue}
								    getCurrentDoc={function(){return self.state}}/>
							</div>
						</div>
						{/*<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right">
								<input type="number"
									min="1"
									className="form-control"
									ref={(e)=>{this.quantity=e}}
									placeholder="Quantity (optional)"/>
							</div>
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right">
								<manageRecords.DataTypeDelegator key={global.guid()}
									innerComponent={true}
							        noDisplayName={true}
									org={"public"}
									propertyName={"needDate"}
								    property={{
									      "description": "Need by date",
									      "displayName": "Need by",
									      "prompt": "Need by date (optional)",
									      "itemProp": "",
									      "dataType": {
									        "type": "date"
									      },
									      "required": true
									    }}
								    defaultValue={this.state.needDate}
								    permission={"edit"}
								    setPropertyValue={this.setPropertyValue}
								    getCurrentDoc={function(){return self.state}}/>
							</div>
						</div>*/}
						<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
							<div className="display-inline-block extra-padding-right">
								<button ref={(e)=>{this.sendButton=e}} type="button" className="chatButton" onClick={this.submitBroadCastMessage}>
									Send
								</button>
							</div>
							{/*<div className="display-inline-block extra-padding-right">
								<button type="button" data-target data-type="parent-hide" className="chatButton" onClick={this.props.setCurrentView.bind(null,"topics")}>
									Cancel
								</button>
							</div>*/}
						</div>
					</div>
				</div>
		);
	}
}
class TopicsView extends React.Component{
	constructor(props) {
		super(props);
		this.state=this.getStateFromProps(props);
		this.getChatView=this.getChatView.bind(this);
		this.getTopicView=this.getTopicView.bind(this);
	}
	getStateFromProps(props){
		return {
			topicsAndChats:Array.isArray(props.topicsAndChats)?props.topicsAndChats:[],
			topics:Array.isArray(props.topics)?props.topics:[],
			orgs:Array.isArray(props.orgs)?props.orgs:[],
			chats:Array.isArray(props.chats)?props.chats:[],
			currentView:props.currentView,
			currentTopic:props.currentTopic,
			currentChat:props.currentChat,
			currentOrg:props.currentOrg
		}
	}
	componentDidMount(){
	}
	componentWillReceiveProps(nextProps){
		this.setState(this.getStateFromProps(nextProps));
	}
	getTopicView(topic,divId){
		var status;
		if(topic.status && typeof topic.status[this.props.userId] == "object"){
			status=topic.status[this.props.userId].type;
		}
		return <div className={"col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding-left no-padding topicHover "+(this.state.currentTopic==topic.id?"":"collapsed")}
	      		data-toggle="collapse"
	      		data-target={divId?("#"+divId):""}
	      		aria-expanded="true">
	            <div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 margin-top-gap-sm margin-bottom-gap-sm">
						<div className=" col-lg-8 col-md-8 col-sm-7 col-xs-7 no-padding pointer " onClick={this.props.setCurrent.bind(null,topic.id,"topic",topic)}>
							<div className="child-img-component">
								<IconName type="user" showImage={true} id={topic.userId}/>
							</div>
							<div className="child-img-component">
								<div className="chatEllipsis topicSummary">{topic.topic}</div>
								<IconName style={{"fontSize":"12px","marginTop":"5px"}} type="user" hideImage={true} id={topic.userId}/>
							</div>
						</div>
						<div className="pull-right text-grey col-lg-4 col-md-4 col-sm-5 col-xs-5 no-padding">
							<CounterAndActions
								userId={this.props.userId}
								type={"topic"}
								status={status}
								id={topic.id}
								count={(topic.counter && topic.counter[this.props.userId])?topic.counter[this.props.userId].count:0}
								time={timeFormat(topic.createdDate)}/>
						</div>
	             </div>
	       </div>
	}
	getChatView(chat, fullView){
		var status;
		if(chat.status && typeof chat.status[this.props.userId] == "object"){
			status=chat.status[this.props.userId].type;
		}
		if(fullView){
			var chatOrg=chat.org?chat.org:undefined
			return(<div  key={global.guid()} className={(this.state.currentChat==chat.id?"graybackground ":" ")+"row itemHover"}>
						<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 margin-top-gap-sm margin-bottom-gap-sm">
							<div className=" col-lg-8 col-md-8 col-sm-7 col-xs-7 no-padding pointer "
								onClick={this.props.setCurrent.bind(null,chat.id,"chat",chat)}>
								<div className="child-img-component">
									<IconName type="user" showImage={true} id={chat.chatFrom==this.props.userId?chat.chatTo:chat.chatFrom}/>
								</div>
								<div className="child-img-component">
									<div className="chatEllipsis topicSummary">{chat.topic}</div>
									<div style={{"whiteSpace":"nowrap"}}>
										<div className="display-inline-block">
											<IconName style={{"fontSize":"12px","overflowX": "hidden"}}
												type="user" hideImage={true}
												id={chat.chatFrom==this.props.userId?chat.chatTo:chat.chatFrom}/>
										</div>
										{chatOrg?
											<div className="display-inline-block">
												<div className="display-inline-block" style={{"overflowX": "hidden"}}>,&nbsp;</div><IconName style={{"display":"inline-block","fontSize":"12px","overflowX": "hidden","textOverflow": "ellipsis","width": "100px"}}
															type="org" hideImage={true}
															id={chatOrg}/>
												</div>
											:""

										}
									</div>
								</div>
							</div>
							<div className="pull-right text-grey col-lg-4 col-md-4 col-sm-5 col-xs-5 no-padding">
								<CounterAndActions
									userId={this.props.userId}
									type={"chat"}
									status={status}
									id={chat.id}
									count={chat.counter[this.props.userId].count}
									time={timeFormat(chat.updatedDate)}/>
							</div>
						</div>
			       </div>)
		}else{
			return <div key={global.guid()} className={(this.state.currentChat==chat.id?"graybackground ":" ")+" row itemHover "}>
					<div className={"name1  extra-padding-top extra-padding-bottom col-lg-12 col-md-12 col-sm-12 col-xs-12"}>
						<div className="left display-inline-block pointer" onClick={this.props.setCurrent.bind(null,chat.id,"chat",chat)}>
							<IconName type="user" id={chat.chatFrom==this.props.userId?chat.chatTo:chat.chatFrom}/>
						</div>
						<CounterAndActions
							userId={this.props.userId}
							type={"chat"}
							status={status}
							id={chat.id}
							count={chat.counter[this.props.userId].count}
							time={timeFormat(chat.updatedDate)}/>
					</div>
				</div>
		}
	}
	render(){
		//var type=this.state.type;
		var self=this;
		if(this.state.currentView=="topics" || this.state.currentView=="topicsAndChats"){
			var items=this.state.currentView=="topics"?this.state.topics:this.state.topicsAndChats;
			return <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding ">
					{
						items.map(function(topic){
							var _isCurrent=false;
							if(self.state.currentTopic==topic.id){
								_isCurrent=true;
							}
							var id="topics"+global.guid();
							if(topic.type=="Topic"){
								return <div key={global.guid()}
										id={"collapse "+id}
										className={"col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding-left no-padding-right add-border-bottom-pin"}>
			                              	{self.getTopicView(topic,_isCurrent,id)}
			                               <div id={id} style={{"minHeight":"auto"}} className={"col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding "+(_isCurrent?("collapse in "):"")}>
			                                    {
											    	(self.state.currentView=="topics" && Array.isArray(self.state.chats) && self.state.currentTopic==topic.id)?(
											    		<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
												    	{
													    	self.state.chats.map(function(chat){
													    		return self.getChatView(chat);
													    	})
													    }
													    {(self.state.chats.length==0?<div className="text-grey col-lg-12 col-md-12 col-sm-12 col-xs-12  margin-bottom-gap-sm margin-top-gap-sm">No chats available{((self.props.mobile)?<span onClick={self.props.toggleDivs} className="icons8-info-2 fa-x pull-right pointer" style={{"color":"#000"}}/>:"")}</div>:"")}
													    </div>):""
												    }
			                               </div>
			                        </div>
		                        }else{
	                        	return <div key={global.guid()} className={"col-lg-12 col-sm-12 col-md-12 col-xs-12 add-border-bottom-pin "}>
	                        				{self.getChatView(topic,"fullView")}
	                        			</div>
	                        }
						})
					}
				</div>
			}else if(this.state.currentView=="orgs"){
				return <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding ">
						{
							this.state.orgs.map(function(org){
								var _isCurrent=false;
								if(self.state.currentOrg==org.org){
									_isCurrent=true;
								}
								var id="orgs"+global.guid();
								return <div key={global.guid()} id={"collapse "+id}
											className={"col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding-left no-padding-right add-border-bottom-pin "}>
			                              <div className={"col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding-right extra-padding-bottom extra-padding-top topicHover "+(_isCurrent?"":"collapsed")}
				                              		data-toggle="collapse"
				                              		data-target={"#"+id}
				                              		aria-expanded="true">
			                                    <div className="parent-img-component col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding-left">
			                                        <div className="child-img-component" onClick={self.props.setCurrent.bind(null,org.org,"org",undefined)}>
			                                        	<IconName noFormGroup={true} type="org" id={org.org}/>
			                                        </div>
			                                		<div key={global.guid()} className=" child-img-component no-padding" onClick={_isCurrent?function(){}:self.props.setCurrent.bind(null,org.org,"org",undefined)}>
			                                			<span className="pull-right collapseLayout icons8-plus-math fa-2x"></span>
			                                		</div>
			                                     </div>
			                               </div>
			                               <div id={id} style={_isCurrent?{"minHeight":"100px"}:{}} className={"col-lg-12 col-sm-12 col-xs-12 col-md-12 "+(_isCurrent?("collapse in"):"")}>
			                                    {
											    	(Array.isArray(self.state.chats) && self.state.currentOrg==org.org)?(
											    		<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
													    	{
														    	self.state.chats.map(function(chat){
														    		return self.getChatView(chat,"fullView");
														    	})
														    }
														    {(self.state.chats.length==0?<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12  margin-bottom-gap-sm margin-top-gap-sm">No chats available {((self.props.mobile)?<span onClick={self.props.toggleDivs} className="icons8-info-2 fa-x pull-right pointer" style={{"color":"#000"}}/>:"")}</div>:"")}
													    </div>):""
											    }
			                               </div>
			                        </div>
							})
						}
					</div>
			}else if(this.state.currentView=="pending" || this.state.currentView=="archivedTopics"){
				return <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding ">
						{
							this.state.topics.map(function(topic){
								return self.getTopicView(topic);
							})
						}
						</div>
			}else if(this.state.currentView=="archivedChats"){
				return <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
						{
							this.state.chats.map(function(chat){
								return self.getChatView(chat,"fullView");
							})
						}
						</div>
			}else{
				return <div className="hidden"></div>
			}
	}
}
class ChatView extends React.Component {
	constructor(props) {
		super(props);
		this.state=this.getStateFromProps(props);
		this.handleFileSubmit=this.handleFileSubmit.bind(this);
		this.sendMessage=this.sendMessage.bind(this);
		this.observeEnterKeyPress=this.observeEnterKeyPress.bind(this);
		this.prepareForRFI=this.prepareForRFI.bind(this);
		this.createdRFI=this.createdRFI.bind(this);
		this.addImage=this.addImage.bind(this);
		this.uploadImages=this.uploadImages.bind(this);
		this.getFile=this.getFile.bind(this);
		this.openRecord=this.openRecord.bind(this);
		this.saveRecordUpdate=this.saveRecordUpdate.bind(this);
	}
	getStateFromProps(props){
		return {
			currentChat:props.currentChat,
			currentChatDetails:props.currentChatDetails,
			insertRFI:false
		};
	}
	componentWillReceiveProps(nextProps){
		this.setState(this.getStateFromProps(nextProps));
	}
	handleFileSubmit(e){
	//	var file = e.target.files[0];
	//	var stream = ss.createStream();
	}
	observeEnterKeyPress(event){
//		var self=this;
		var code=event.keyCode? event.keyCode:event.which;
		if(code==13 && !event.shiftKey){
			this.sendMessage();
			event.preventDefault();
		}
	}
	scrollBottom(){
	// $(".contentNavHeight").scrollTop($(".contentNavHeight").height());
	}
	sendMessage(){
		if(this.message.value.trim()){
			common.startLoader();
			socket.emit(
				'sendchat',
				this.props.userId,
				this.message.value,
				this.state.currentChatDetails.topicId,
				this.state.currentChatDetails.chatFrom==this.props.userId?this.state.currentChatDetails.chatTo:this.state.currentChatDetails.chatFrom,
				this.state.currentChatDetails.org
			);
	     	this.scrollBottom();
			this.message.value="";
		}
	}
	componentDidMount(){
		var self=this;
		//self.scrollBottom();
		self.calculateHeight();
		socket.on('update_topic_details', function (topic) {
			if(self.state.currentChatDetails.topicId==topic.id){
				var orgDetails=ShortDetailsStore.get(self.state.currentChatDetails.org);
				if(orgDetails && orgDetails.docType=="Manufacturer"){
					topic.manufacturer=self.state.currentChatDetails.org;
				}
				self.setState({currentTopicDetails:topic,insertRFI:true});
			}
		});
	}
	calculateHeight(){
		try{
		if(window){
			var height=(this.props.mobile)?(window.innerHeight-50):window.innerHeight;;
			if(document.getElementById("chatButton") && document.getElementById("chatButton").clientHeight>0){
				height=height-document.getElementById("chatButton").clientHeight;
			}
			if(document.getElementById("chatHeading") && document.getElementById("chatHeading").clientHeight>0){
				height=height-document.getElementById("chatHeading").clientHeight;
			}
			/*if(document.getElementById("chatSideHeader") && document.getElementById("chatSideHeader").clientHeight>0){
				height=height-document.getElementById("chatSideHeader").clientHeight;
			}**/
			if(document.getElementById("chatContent")){
				document.getElementById("chatContent").style="height:"+height+"px";
			}
			$(".contentNavHeight").scrollTop(document.getElementById("chatContent").scrollHeight);
		}
		}catch(err){}
	}
	componentDidUpdate(){
		if(document.getElementById("chatContent")){
			this.calculateHeight();
			if(this.message && !this.props.mobile){
				this.message.focus();
			}
		}
	}
	prepareForRFI(){
		socket.emit('get_topic_details',this.props.userId,this.state.currentChatDetails.topicId);
	}
	createdRFI(doc){
		common.startLoader();
		socket.emit(
			'sendchat',
			this.props.userId,
			{type:"record",docType:"RFI",recordId:doc.recordId,org:doc.org},
			this.state.currentChatDetails.topicId,
			this.state.currentChatDetails.chatFrom==this.props.userId?this.state.currentChatDetails.chatTo:this.state.currentChatDetails.chatFrom,
			this.state.currentChatDetails.org
		);
     	this.scrollBottom();
		this.message.value="";
		try{trackThis("chat",{type:"RFI",id:doc.recordId});}catch(err){}
	}
	uploadImages(imageId){
		common.startLoader();
		socket.emit(
			'sendchat',
			this.props.userId,
			{type:"image",data:imageId},
			this.state.currentChatDetails.topicId,
			this.state.currentChatDetails.chatFrom==this.props.userId?this.state.currentChatDetails.chatTo:this.state.currentChatDetails.chatFrom,
			this.state.currentChatDetails.org
		);
     	this.scrollBottom();
		this.message.value="";
	}
	addImage(){
       $("#"+this.fileUpload.id).click();
    }
    getFile(event){
        var file={};
        file=event.target.files[0];
        var reader  = new FileReader();
        reader.readAsDataURL(file);
        var id=global.guid();
        var self=this;
        var images=[];
        setTimeout(function(){
            if(reader.result!=null){
                WebAPIUtils.doPost("/generic?operation=saveCloudinaryData",{url:reader.result,id:id},function(result){
                    if(result.data.indexOf("success")!=-1){
                        self.uploadImages(id);
                    }else{
                    	common.createAlert("In complete","Server Error Try Again");
                    }
                })
            }else{
            	common.createAlert("In complete","Data Error Try Again");
            }
        }, 1000);
    }
    openImagePopUp(id){
    	if(id!=""){
	    	var node = document.createElement("div");
		 	node.id = global.guid();
		 	var popUpId = global.guid();
		 	var contentDivId = global.guid();
		 	var sideDivId = global.guid();
		  	node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} noSideDiv={true}/>,node);
	       	ReactDOM.render(<img src={id} className="img-responsive"/>,document.getElementById(contentDivId));
       }
    }
    openRecord(data){
    	if(data){
	    	var node = document.createElement("div");
		 	node.id = global.guid();
		 	var popUpId = global.guid();
		 	var contentDivId = global.guid();
		 	var sideDivId = global.guid();
		  	node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} noSideDiv={true}/>,node);
		  	ReactDOM.render(<genericView.GoIntoDetail key={global.guid()}
								rootSchema={data.docType}
								recordId={data.recordId}
								org={data.org}
								fromPopUp={popUpId}
								contentDivId={contentDivId}
								saveRecordUpdate={this.saveRecordUpdate}/>,document.getElementById(contentDivId));
       }
    }
    saveRecordUpdate(doc){
    	common.startLoader();
		socket.emit(
			'sendchat',
			this.props.userId,
			{type:"record",docType:doc.docType,recordId:doc.recordId,org:doc.org},
			this.state.currentChatDetails.topicId,
			this.state.currentChatDetails.chatFrom==this.props.userId?this.state.currentChatDetails.chatTo:this.state.currentChatDetails.chatFrom,
			this.state.currentChatDetails.org
		);
     	this.scrollBottom();
		this.message.value="";
		try{trackThis("chat",{type:"RFI-Update",id:doc.recordId});}catch(err){}
    }
	render(){
		var self=this;
		var rfiPrivilege=common.getSchemaRoleOnOrg("RFI","public");
		return (
			<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding graybackground">
				<div id="chatHeading" className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right no-padding-left parent-img-component graybackground chatHeaderHeight row text-center mobile-text-right">
						{(this.state.currentChatDetails)?(
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 mobile-no-padding">
							{this.props.backMessage()}
								<div className="display-inline-block extra-padding-left extra-padding-top-sm ">
									<div className="pointer topicHeading" onClick={this.props.setCurrent.bind(null,this.state.currentChatDetails.topicId,"topic",undefined)}>
										{(this.state.currentChatDetails.topic.length>60?(this.state.currentChatDetails.topic.substring(0,60)+"..."):this.state.currentChatDetails.topic)}
									</div>
									<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" style={{"fontSize":"12px","marginTop":"5px"}}>
										<div className="child-img-component no-padding">
											<IconName hideImage={true}
												id={this.state.currentChatDetails.chatFrom==this.props.userId?
													this.state.currentChatDetails.chatTo:
													this.state.currentChatDetails.chatFrom}
												type="user"/>
										</div>
										<div className="child-img-component">
											,&nbsp;
											<div className="display-inline-block" >
												<IconName hideImage={true} id={this.state.currentChatDetails.org} type="org"/>
											</div>
										</div>
									</div>
								</div>
							</div>
						):""}
				</div>
				<div id="chatContent" className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding contentNavHeight">
					{
						(typeof this.state.currentChatDetails=="object" && Array.isArray(this.state.currentChatDetails.chat))?(
							<div className=" col-lg-12 col-sm-12 col-md-12 col-xs-12">
							{
								this.state.currentChatDetails.chat.map(function(value){
									if(typeof value.message=="string"){
										return <div key={global.guid()} className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
												<div  className={((value.chatFrom!=self.props.userId)?'from-them':'from-me')}>
													<div className="thread">
														<div className="chatMessage margin-bottom-gap-xs">{value.message.trim()}</div>
														<div className="chatDate pull-right">{value.date?global.getLocaleDateString(value.date):''}</div>
													</div>
												</div>
											</div>
									}else if(value.message.type=="record"){
										return <div key={global.guid()} className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
												<div  className={((value.chatFrom!=self.props.userId)?'from-them':'from-me')}>
													<div className="thread">
													{/*<a className="blueLink" href={linkGenerator.getDetailLink({org:value.message.org,schema:value.message.docType,recordId:value.message.recordId})} target="_blank">*/}
													<span className="blueLink"
														onClick={self.openRecord.bind(null,value.message)}>
															<common.UserIcon
																	id={value.message.recordId}
																	org={value.message.org?value.message.org:"public"}
																	rootSchema={value.message.docType}
																	noDetail={true}/>
														</span>
														<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
															<div className="chatDate pull-right">{value.date?global.getLocaleDateString(value.date):''}</div>
														</div>
													</div>
												</div>
											</div>

									}else if(value.message.type=="image"){
										var src="https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/"+value.message.data+".jpg";
										return <div key={global.guid()} className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
												<div  className={((value.chatFrom!=self.props.userId)?'from-them':'from-me')}>
													<div className="thread">
														<div className="chatMessage margin-bottom-gap-xs">
															<img src={src} style={{"width":"100%"}} onClick={self.openImagePopUp.bind(null,src)} />
														</div>
														<div className="chatDate pull-right">{value.date?global.getLocaleDateString(value.date):''}</div>
													</div>
												</div>
											</div>
									}else{
										return <div key={global.guid()} className="hidden" />
									}
								})
							}
							{
								this.state.insertRFI?(
									<div key={global.guid()} className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
										<div  className="from-me">
											<div className="thread">
												<manageRecords.DisplayCustomSchema org={"public"}
													schemaName={"RFI"}
													knownData={{
														members:[this.state.currentChatDetails.chatFrom,this.state.currentChatDetails.chatTo],
														architect:this.state.currentTopicDetails.architect,
														manufacturer:this.state.currentTopicDetails.manufacturer,
														product:this.state.currentTopicDetails.product,
														supplier:this.state.currentTopicDetails.supplier,
														category:this.state.currentTopicDetails.category
													}}
													showCancel={true}
													createCallback={this.createdRFI}
													cancelCallback={()=>{this.setState({insertRFI:false});}}
												/>
											</div>
										</div>
									</div>
								):""
							}
							</div>
						):""
					}
				</div>
				<div id="chatButton" className="row col-lg-12 col-md-12 col-sm-12 col-xs-12 add-border-pin topLine">
					<div className="chat-input margin-top-gap-sm col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<textarea ref={(e)=>{this.message=e}}
								className="form-control inputMessage"
								placeholder="Type a message"
		                        onKeyPress={this.observeEnterKeyPress}>
		                    </textarea>
							<i className="icons8-paper-plane sendChat  pointer filterSearch"  onClick={this.sendMessage}></i>
							<div className="addRFI" >
								<div className="userNavHover chat dropup" style={{"position":"relative"}}>
								   <a className="dropdown-toggle" type="button" data-toggle="dropdown" aria-expanded="false" >
									  <i className="pointer icons8-plus" style={{"fontSize":"30px"}}></i>
								   </a>
	    		                   <ul style={{"left":"-120px","minWidth": "65px","color":"#000","paddingBottom":"10px"}} className="arrow_box_down dropdown-menu remove-margin-left noMinWidth remove-margin-right chatDropDown">
									{
	                                   	(rfiPrivilege && rfiPrivilege.create && rfiPrivilege.create!="")?(
	                                   		<li className="navElement"
	                                   			style={{"padding":"0px 7px 7px","borderBottom":"1px solid lightgrey"}}
	                                   			onClick={this.prepareForRFI}>
	                                   			<a className="link no-padding">Request For Information</a>
	                                   		</li>
	                                	):""
	                                }
	                                <li className="navElement" style={{"padding":"7px 7px 0 7px"}} onClick={this.addImage}>
				                        <a className="link no-padding">Images</a>
				                    	<input type="file" ref={(e)=>this.fileUpload=e} className="hidden" id={"IMAGE"+global.guid()} onChange={this.getFile} />
	                                </li>
	                               </ul>
								</div>
							</div>
						</div>

					</div>
				</div>

			</div>
		)
	}

}


class TopicView extends React.Component {
	constructor(props) {
		super(props);
		this.state=this.getStateFromProps(props);
		this.observeEnterKeyPress=this.observeEnterKeyPress.bind(this);
		this.sendMessage=this.sendMessage.bind(this);
		this.setShowStartConversationOptions=this.setShowStartConversationOptions.bind(this);
		this.setPropertyValue=this.setPropertyValue.bind(this);
		this.addMember=this.addMember.bind(this);
		this.deleteFromTopic=this.deleteFromTopic.bind(this);
	}
	getStateFromProps(props){
		var currentTopicDetails=props.currentTopicDetails;
		var owner;
		var orgs=[];
		var selectedOrg;
		if(currentTopicDetails){
			owner=(currentTopicDetails.userId==props.userId);
			if(Array.isArray(currentTopicDetails.contacted)){
				currentTopicDetails.contacted.map(function(value){
					if(!owner && value.userId==props.userId){
						orgs.push({org:value.org,status:value.status});
					}
				});
			}
		}
		if(orgs.length==1){
			selectedOrg=orgs[0].org;
		}
		return {
			userId:props.userId,
			currentTopic:props.currentTopic,
			showStartConversationOptions:false,
			showAddMemberOptions:false,
			selectedOrg:selectedOrg,
			selectedUser:undefined,
			currentTopicDetails:props.currentTopicDetails,
			owner:owner,
			orgs:orgs
		};
	}
	componentWillReceiveProps(nextProps){
		this.setState(this.getStateFromProps(nextProps));
	}
	observeEnterKeyPress(event){
		//var self=this;
		var code=event.keyCode? event.keyCode:event.which;
		if(code==13 && !event.shiftKey){
			this.sendMessage();
		}
	}
	componentDidMount(){
		if(document.getElementById("topicContent")){
			this.calculateHeight();
		}
	}
	calculateHeight(){
		try{
		if(window){
			var height=(this.props.mobile)?(window.innerHeight-50):window.innerHeight;;
			if(document.getElementById("topicButton") && document.getElementById("topicButton").clientHeight>0){
				height=height-document.getElementById("topicButton").clientHeight;
			}
			if(document.getElementById("topicHeading") && document.getElementById("topicHeading").clientHeight>0){
				height=height-document.getElementById("topicHeading").clientHeight;
			}
			/*if(document.getElementById("chatSideHeader") && document.getElementById("chatSideHeader").clientHeight>0){
				height=height-document.getElementById("chatSideHeader").clientHeight;
			}*/
			if(document.getElementById("topicContent")){
				document.getElementById("topicContent").style="height:"+height+"px";
			}
		}
		}catch(err){}
	}
	componentDidUpdate(){
		if(document.getElementById("topicContent")){
			this.calculateHeight();
		}
	}
	setShowStartConversationOptions(org){
		this.setState({showStartConversationOptions:true,org:org});
	}
	sendMessage(){
		if(this.message.value.trim()){
			socket.emit('sendchat', this.props.userId, this.message.value, this.state.currentTopic, this.state.currentTopicDetails.userId,this.state.org);
			this.message.value="";
			this.setState({showStartConversationOptions:false});
		}
	}
	addMember(){
	//	var self=this;
		var Admin=false;
		for(var i=0;i<this.state.orgs.length;i++){
			if(this.state.orgs[i].org=="Wishkarma"){
				Admin=true;
			}
		}
		if(!this.state.selectedUser){
			alert("Please select a user");
			return;
		}
		if(!this.state.selectedOrg){
			alert("Please select Organization");
			return;
		}

		var userDetails={
			userId:this.state.selectedUser,
			org:this.state.selectedOrg,
			status:"pending"
		};
		var flag=true;
		if(this.state.currentTopicDetails){
			if(Array.isArray(this.state.currentTopicDetails.contacted)){
				for(var index=0;index<this.state.currentTopicDetails.contacted.length;index++){
					if(this.state.currentTopicDetails.contacted[index].org==userDetails.org &&
						this.state.currentTopicDetails.contacted[index].userId==userDetails.userId){
							flag=false;
							alert("User already exists with current Organization");
							return;
						}
				}
			}
		}
		if(flag){
			this.setState({showAddMemberOptions:false});
			socket.emit("addUserToTopic",this.state.userId,this.state.currentTopic,userDetails);
		}
	}
	deleteFromTopic(userDetails){
		socket.emit("deleteUserFromTopic",this.state.userId,this.state.currentTopic,userDetails);
	}
	setPropertyValue(key,value){
		var state=this.state;
		state[key]=value;
		this.setState(state);
	}
	render(){
		var self=this;
		var Admin=false;
		for(var i=0;i<this.state.orgs.length;i++){
			if(this.state.orgs[i].org=="Wishkarma"){
				Admin=true;
			}
		}
		return (
			<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding graybackground">
				<div id="topicHeading" className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right no-padding-left parent-img-component graybackground  chatHeaderHeight row text-center mobile-text-right">
						{this.props.backMessage()}
						{(this.state.currentTopicDetails)?(
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 extra-padding-top-sm topicHeading">
								{(this.state.currentTopicDetails.topic.length>60?(this.state.currentTopicDetails.topic.substring(0,60)+"..."):this.state.currentTopicDetails.topic)}
							</div>
						):""}
				</div>
				<div id="topicContent" className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding contentNavHeight">
					{
						(this.state.currentTopicDetails)?(
							<div style={{"fontSize":"12px"}} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
								<div className="col-lg-12 margin-top-gap-sm margin-bottom-gap-sm col-md-12 col-sm-12 col-xs-12 no-padding text-center" >
									<span className="msg">
										<div className="display-inline-block">
										{
											this.state.currentTopicDetails.userId==this.props.userId?
											"You":<IconName id={this.state.currentTopicDetails.userId} hideImage={true} type="user"/>
										}</div> created the topic <strong>{this.state.currentTopicDetails.topic}</strong>
									</span>
								</div>
								<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left form-group">
									<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" style={{"border": "1px solid lightgray","padding": "10px 10px 0 10px"}}>
										<h5 className="remove-margin-top">{this.state.currentTopicDetails.message}</h5>
										<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
											<div>
												<div className="parent-img-component">
													<div className="child-img-component extra-padding-right-sm extra-padding-bottom">CATEGORY :</div>
													<div className="display-inline-block no-padding">
														<common.UserIcon
																key={global.guid()}
																id={this.state.currentTopicDetails.category}
																org={"public"}
																rootSchema={"ProductCategory"}/>
													</div>
												</div>
											</div>
											{this.state.currentTopicDetails.needDate?<div className="form-group">NEED BY : {this.state.currentTopicDetails.needDate}</div>:""}
											{this.state.currentTopicDetails.project?<div className="form-group">PROJECT : {this.state.currentTopicDetails.project}</div>:""}
											<div className="form-group">LOCATION NEEDED : {
												typeof this.state.currentTopicDetails.locationNeeded=="object"?
													this.state.currentTopicDetails.locationNeeded.locationName:
													this.state.currentTopicDetails.locationNeeded
												}
											</div>
											{this.state.currentTopicDetails.quantity?<div className="form-group">QUANTITY : {this.state.currentTopicDetails.quantity}</div>:""}
										</div>
									</div>
								</div>
							    {
									(!this.state.owner && Array.isArray(this.state.orgs) && this.state.orgs.length>0)?(
										<div className="margin-top-gap-sm text-center col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
											{
												this.state.orgs.map(function(org){
													if(org.status=="responded"){
														return <li key={global.guid()} className="topicStatusRow">
																<span className="msg">
																	You started conversation as&nbsp;
																	<div className="display-inline-block"><IconName hideImage={true} id={org.org} type={"org"}/></div>
																</span>
															</li>
													}else{
														return <li key={global.guid()} className="topicStatusRow display-inline-block extra-padding-right">
															<button type="button"
																className="btn strt-conv chatButton no-margin"
																onClick={self.setShowStartConversationOptions.bind(null,org.org)}>
																Start Conversation as
																<IconName  hideImage={true} id={org.org} type={"org"}/>
															</button>
														</li>
													}
												})
											}
										</div>
									):("")
								}

							</div>
						):("")
					}
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
					{
						(this.state.currentTopicDetails && this.state.currentTopicDetails.manufacturer)?(
							<IconName id={this.state.currentTopicDetails.manufacturer} type={"org"}/>
						):""
					}
					{
						(this.state.currentTopicDetails && this.state.currentTopicDetails.supplier)?(
							<IconName id={this.state.currentTopicDetails.supplier} type={"org"}/>
						):""
					}
					{
						(this.state.currentTopicDetails && this.state.currentTopicDetails.product)?(
							<common.UserIcon id={this.state.currentTopicDetails.product} rootSchema="Product" org="public"/>
						):""
					}
					</div>
					{
						(this.state.owner && !Array.isArray(this.state.currentTopicDetails.contacted))?
									(<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
									                <ul className="bokeh">
									                    <li></li>
									                    <li></li>
									                    <li></li>
									                </ul>
									</div>):
											""
					}
					{
						(this.state.currentTopicDetails && (Admin) && Array.isArray(this.state.currentTopicDetails.contacted))?(
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
								<label className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-top-gap-sm">
									Engaged Users:
								</label>
								{
									this.state.currentTopicDetails.contacted.map(function(c){
										return <div key={global.guid()} className="display-inline-block form-group">
													<div className="parent-img-component">
														<div className="child-img-component no-padding">
															<IconName noFormGroup={true} id={c.userId} type={"user"}/>
														</div>
														{(Admin && self.state.userId!=c.userId)?<div className="icons8-delete  fa-x link child-img-component form-group extra-padding-right  fa-x link"  onClick={self.deleteFromTopic.bind(null,c)}></div>:""}
													</div>
												</div>
									})
								}

								{
									this.state.currentTopicDetails.contacted.map(function(value){
										if(value.userId!=self.props.userId && value.status=='responded'){
											return <li key={global.guid()} className="topicStatusRow">
														<span className="msg">
															<div className="display-inline-block">
														 		<IconName noFormGroup={true} id={value.userId} hideImage={true} type={"user"}/>
														 	</div> started conversation
														 </span>
													</li>
										}else{
											return <li key={global.guid()} className="hidden"></li>
										}
									})
								}
							</div>
						):""
					}
					{
						((!this.state.owner || Admin) && !this.state.showAddMemberOptions)?(<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="child-img-component">
								<i className="fa fa-user-plus pointer fa-2x"  onClick={()=>{this.setState({showAddMemberOptions:true});}}></i>
							</div>
						</div>):""
					}
					{
						(this.state.showAddMemberOptions)?(
							<div className="row col-lg-12 col-md-12 col-sm-12 col-xs-12">
								{
									(Admin)?(
										<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
											<div className="h4">Adding New Member</div>
											{
												this.state.selectedOrg?(
													<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
														<div>Adding to</div>
														<IconName type="org" id={this.state.selectedOrg}/>
													</div>
												):""
											}
											{
												(this.state.currentTopicDetails &&
													(this.state.currentTopicDetails.manufacturer ||
													this.state.currentTopicDetails.supplier))?
													<div>Select Existing Manufacturer|Supplier</div>:""
											}
											<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
											{
												(this.state.currentTopicDetails && this.state.currentTopicDetails.manufacturer)?(
													<div className={(self.state.selectedOrg==this.state.currentTopicDetails.manufacturer?"graybackground ":" ")+" display-inline-block extra-padding-left extra-padding-top"}
																key={this.state.currentTopicDetails.manufacturer}
																onClick={self.setPropertyValue.bind(null,"selectedOrg",this.state.currentTopicDetails.manufacturer)}>
															<IconName type="org" id={this.state.currentTopicDetails.manufacturer}/>
														</div>
												):""
											}
										</div>
										<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
										{
											(this.state.currentTopicDetails && this.state.currentTopicDetails.supplier)?(
												<div className={(self.state.selectedOrg==this.state.currentTopicDetails.supplier?"graybackground ":" ")+" display-inline-block extra-padding-left extra-padding-top"}
															key={this.state.currentTopicDetails.supplier}
															onClick={self.setPropertyValue.bind(null,"selectedOrg",this.state.currentTopicDetails.supplier)}>
														<IconName type="org" id={this.state.currentTopicDetails.supplier}/>
													</div>
											):""
										}
										</div>
										<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding	">
											<span className="link"
												onClick={()=>{this.setState({showOrgTypeSelection:true,selectedOrg:undefined})}}>
												Select New Organization
											</span>
										</div>
										{
										this.state.showOrgTypeSelection?
											<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
												<manageRecords.DataTypeDelegator key={global.guid()}
													innerComponent={true}
											        noDisplayName={true}
													org={"public"}
													propertyName={"orgType"}
												    property={{
													      "description": "Organization Type",
													      "displayName": "Organization Type",
													      "prompt": "Select Organization Type",
													      "itemProp": "",
													      "dataType": {
													        "type": "pickList",
													        "options":[
													        	"Supplier",
													        	"Manufacturer",
													        	"Provider",
													        	"ServiceProvider",
													        	"Developer",
													        	"Organization"
													        ]
													      },
													      "required": true
													    }}
												    defaultValue={this.state.orgType}
												    permission={"edit"}
												    setPropertyValue={this.setPropertyValue}
												    getCurrentDoc={function(){return self.state}}/>
											</div>:""
										}
										</div>
									):""
								}

								{
									(Admin && this.state.orgType)?(
										<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
											<div className="form-group col-lg-6 col-md-6 col-sm-6 col-xs-12 no-padding-right">
												<manageRecords.DataTypeDelegator key={global.guid()}
													innerComponent={true}
											        noDisplayName={true}
													org={"public"}
													propertyName={"selectedOrg"}
												    property={{
													      "description": "Organization",
													      "displayName": "Organization",
													      "prompt": "Select Organization",
													      "itemProp": "",
													      "dataType": {
													        "type": "object",
													        "objRef":this.state.orgType,
													        "refKey":"recordId",
													        "refType":"lookup"
													      },
													      "required": true
													    }}
												    defaultValue={this.state.selectedOrg}
												    permission={"edit"}
												    setPropertyValue={this.setPropertyValue}
												    getCurrentDoc={function(){return self.state}}/>
											</div>
										</div>
									):(this.state.orgs.length>1?(<div>
										<div>
											Select Organization
										</div>
										{
											this.state.orgs.map(function(org){
												return <div className={(self.state.selectedOrg==org.org?"graybackground ":" ")+" display-inline-block  extra-padding-left extra-padding-top"}
															key={org.org}
															onClick={self.setPropertyValue.bind(null,"selectedOrg",org.org)}>
														<IconName type="org" id={org.org}/>
													</div>
											})
										}
									</div>):"")
								}
								<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
									<div className="form-group col-lg-6 col-md-6 col-sm-6 col-xs-12 no-padding-right">
										<manageRecords.DataTypeDelegator key={global.guid()}
											innerComponent={true}
									        noDisplayName={true}
											org={"public"}
											propertyName={"selectedUser"}
										    property={{
											      "description": "User",
											      "displayName": "Person",
											      "prompt": "Select Person",
											      "itemProp": "",
											      "dataType": {
											        "type": "object",
											        "objRef":"User",
											        "refKey":"recordId",
											        "refType":"ajax"
											      },
											      "required": true
											    }}
										    defaultValue={this.state.selectedUser}
										    permission={"edit"}
										    setPropertyValue={this.setPropertyValue}
										    getCurrentDoc={function(){return self.state}}/>
									</div>
								</div>
								<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
									<div className="display-inline-block extra-padding-right">
										<button ref={(e)=>{this.addButton=e}} type="button" className="chatButton" onClick={this.addMember}>
											Add
										</button>
									</div>
									<div className="display-inline-block extra-padding-right">
										<button type="button" data-target data-type="parent-hide" className="chatButton" onClick={()=>{this.setState({showAddMemberOptions:false});}}>
											Cancel
										</button>
									</div>
								</div>
							</div>
						):""
					}
				</div>
				{
					(this.state.showStartConversationOptions)?(
						<div className="row col-lg-12 col-md-12 col-sm-12 col-xs-12 add-border-pin topLine" id="topicButton">
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<div className="display-inline-block extra-padding-right-sm"> Starting Conversation As</div><div className="display-inline-block"><IconName hideImage={true} type="org" id={this.state.org}/></div>
							</div>
							<div className="chat-input margin-top-gap-sm col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
								<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
									<textarea ref={(e)=>{this.message=e}}
										className="form-control inputMessage"
										placeholder="Type a message"
				                        onKeyPress={this.observeEnterKeyPress}>
				                    </textarea>
									{/*<input ref={(e)=>{this.message=e}}
										className="inputMessage form-control"
										placeholder="Type a message"
										onKeyPress={this.observeEnterKeyPress}/>*/}
									<div>
										<label className="">
											<i className="icons8-paper-plane sendChat pointer filterSearch "  onClick={this.sendMessage}></i>
										</label>
									</div>
								</div>
							</div>
						</div>
					):""
				}
		</div>
		)
	}
}


class CounterAndActions extends React.Component {
	constructor(props) {
		super(props);
		this.state=this.getStateFromProps(props);
		this.doArchive=this.doArchive.bind(this);
		this.doDelete=this.doDelete.bind(this);
		this.doUnArchive=this.doUnArchive.bind(this);
	}
	getStateFromProps(props){
		return props;
	}
	componentWillReceiveProps(nextProps){
		if(this.props.id!=nextProps.id)
		this.setState(this.getStateFromProps(nextProps));
	}
	componentDidMount(){
	}
	doArchive(){
		if(this.props.type=="chat"){
			socket.emit('archiveChat',this.props.userId, this.state.id);
		}else{
			socket.emit('archiveTopic',this.props.userId, this.state.id);
		}
	}
	doUnArchive(){
		if(this.props.type=="chat"){
			socket.emit('unArchiveChat',this.props.userId, this.state.id);
		}else{
			socket.emit('unArchiveTopic',this.props.userId, this.state.id);
		}
	}
	doDelete(){
		if(this.props.type=="chat"){
			socket.emit('deleteChat',this.props.userId, this.state.id);
		}else{
			socket.emit('deleteTopic',this.props.userId, this.state.id);
		}
	}
	render(){
		var count=this.props.count;
		if(isNaN(count)){
			count=0;
		}
		count=count*1;
		return <div className="counterAndActions display-inline-block pull-right">

					<div className="display-inline-block pull-right">
						{count>0?(<div className="extra-padding-right-sm display-inline-block">
										<span className="counter">
											{count}
										</span>
								  </div>):""}
						<div className="display-inline-block pull-right">
							<div className="userNavHover chat" style={{"position":"relative"}}>
							   <a data-toggle="dropdown" className="dropdown-toggle" aria-expanded="false" >
								  <i className="icons8-three-dots-symbol text-black" aria-hidden="true"></i>
							   </a>
    		                   <ul style={{"left":"-40px","minWidth": "65px","color":"#000","fontSize":"12px"}} className="dropdown-menu arrow_box remove-margin-left noMinWidth remove-margin-right">
                                    <li className="pointer" style={{"padding":"5px","borderBottom":"1px solid lightgrey"}} onClick={this.props.status=="archived"?this.doUnArchive:this.doArchive}>{this.props.status=="archived"?"Unarchive":"Archive"}</li>
							    	<li className="pointer" style={{"padding":"5px"}} onClick={this.doDelete}>Delete</li>
                               </ul>
							</div>
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div style={{"transform": "rotate(180deg) scale(1)","fontSize":"10px","marginBottom":"10px"}} className="icons8-left-arrow-2 pull-right">&nbsp;</div>
						</div>
						<div className="time text-grey col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding text-right ">
						{this.props.time?
								(<span>{this.props.time}
								</span>):""}
					</div>
					</div>
				</div>
	}
}

class NotificationsCount extends React.Component{
	constructor(props) {
		super(props);
		this.state=this.getStateFromProps(props);
		this._onChange=this._onChange.bind(this);
	}
	getStateFromProps(props){
		return {details:ShortDetailsStore.get("allNotificationsCount")};
	}
	_onChange(){
		this.setState({details:ShortDetailsStore.get("allNotificationsCount")});
	}
	componentWillUnmount() {
		ShortDetailsStore.removeChangeListener(this._onChange,"allNotificationsCount");
  	}
	componentDidMount(){
		var self=this;
		socket.emit('adduser', this.props.userId);
		socket.emit('get_all_my_notifications_count',this.props.userId);
		socket.on('new_chat',function(){
			common.stopLoader();
			socket.emit('get_all_my_notifications_count',self.props.userId);
		});
		socket.on('new_topic',function(){
			socket.emit('get_all_my_notifications_count',self.props.userId);
		});
		ShortDetailsStore.addChangeListener(this._onChange,"allNotificationsCount");
	}
	render(){
		var allNotificationsCount=0;
		if(this.state.details){
			allNotificationsCount=this.state.details.count;
		}
		if(this.props.wrap){
			if(allNotificationsCount>0){
				return <span className="notification-count pointer">{allNotificationsCount}</span>;
			}else{
				return <span/>
			}
		}else{
			return <span className="counter pointer">{allNotificationsCount>0?allNotificationsCount:""}</span>;
		}
	}
}
exports.NotificationsCount=NotificationsCount;
exports.ChatComponent=ChatComponent;

class SendMessage extends React.Component{
	constructor(props) {
		super(props);
		this.state={};
	}
	render(){
		if((common.getUserDoc() != undefined && common.getUserDoc().recordId!=undefined)){
			return <button ref={(e)=>{this.sendButton=e}} type="button" className="chatButton" onClick={startConversation.bind(null,this.props.type,this.props.id)}>
					Start a New Conversation
				</button>
		}else{
			return <span/>
		}
	}
}

function startConversation(type,id){
	if((common.getUserDoc() != undefined && common.getUserDoc().recordId!=undefined)){
		var node = document.createElement("div");
		node.id = global.guid();
		var popUpId = global.guid();
		var contentDivId = global.guid();
		var sideDivId = global.guid();
		node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		node.style.overflow="hidden";
		document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} chatDiv={true} noSideDiv={true}/>,node);
		ReactDOM.render(<ChatComponent userId={common.getUserDoc().recordId} composeMode={true}  type={type} id={id}/>,document.getElementById(contentDivId));
		try{trackThis("chat",{type:type,id:id});}catch(err){}
	}
}
exports.SendMessage=SendMessage;
exports.startConversation=startConversation;
//ReactDOM.render(<ChatComponent/>,document.getElementById('root'));
