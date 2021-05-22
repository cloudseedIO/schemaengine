//'use strict';
//var React=require("react");
//var ReactDOM = require("react-dom");
//var ShortDetailsStore = require('../stores/ShortDetailsStore.js');
var SERVER_URL = 'https://localhost:3000';
var socket;
socket = io.connect(SERVER_URL);
/*socket.on("update_org_details",function(data){
	ShortDetailsStore.receiveShortDetails(data);
})
socket.on("update_user_details",function(data){
	ShortDetailsStore.receiveShortDetails(data);
})*/

var allNotificationsCount=0;
socket.on('update_all_my_notfications_count', function(res){
	allNotificationsCount=res.results[0].count;
});

var guid = (function() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
	}
	return function() {
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
	};
})();
function serializeFormObj(arrayObj){
	var new_obj = {};
	$.each(arrayObj, function(i, obj) { new_obj[obj.name] = obj.value; });
	return	new_obj;
}
function timeFormat(strDate){
	var time = new Date(strDate).toLocaleTimeString();	
	return time.toString().substring(0, time.lastIndexOf(':')) + "  ";
}
function downloadBlob(data, fileName, mimeType) {
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
}
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
		return {id:props.id,details:undefined};
		//return {id:props.id,details:ShortDetailsStore.get(props.id)};
	}
	_onChange(){
		//this.setState({details:ShortDetailsStore.get(this.state.id)});
	}
	componentWillReceiveProps(nextProps){
		if(this.props.id!=nextProps.id)
		this.setState(this.getStateFromProps(nextProps));
	}
	componentWillUnmount() {
		//ShortDetailsStore.removeChangeListener(this._onChange,this.state.id);
  	}
	componentDidMount(){
		if(!this.state.record){
			if(this.props.type=="org"){
				socket.emit("get_org_details",this.state.id);
			}else{
				socket.emit("get_user_details",this.state.id);
			}
		 //  	ShortDetailsStore.addChangeListener(this._onChange,this.state.id);
		}
		var self=this;
		if(this.props.type=="org"){
			socket.on("update_org_details",function(data){
				if(data.id==self.state.id)
					self.setState({details:data});
			})
		}else{
			socket.on("update_user_details",function(data){
				if(data.id==self.state.id)
					self.setState({details:data});
			})
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
			return (<div>
						{name}
					</div>)
		}else{
			return <div className="display-inline-block">
						<div className="parent-img-component userIcon-height">
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
class ChatComponent extends React.Component{
	constructor(props) {
		super(props);
		this.state={
			userId:undefined,
			userDetails:{},
			currentView:"topics",				//compose|topics|orgs|pending|archive
			currentTopic:undefined,
			currentOrg:undefined,
			currentChat:undefined,
			topics:[],
			orgs:[],
			chats:[],
			notifications:undefined
		};
		this.setCurrentView=this.setCurrentView.bind(this);
		this.setSortOption=this.setSortOption.bind(this);
		this.performSocketRegistrations=this.performSocketRegistrations.bind(this);
		this.setCurrent=this.setCurrent.bind(this);
	}
	componentDidMount(){
		if(this.props.userId){
			this.setState({userId:this.props.userId},this.performSocketRegistrations);
		}else{
			var id=prompt("Enter your Id   User2cc75dc3-44b0-45c3-4532-a20724a73dc5   UserFBEye     User7576f075-4f7b-f647-b776-bb0034ed0ecb");
			this.setState({userId:id?id:"User2cc75dc3-44b0-45c3-4532-a20724a73dc5"},this.performSocketRegistrations);
		}
	}
	performSocketRegistrations(){
		var self=this;
		socket.emit('adduser', this.state.userId);
	
		socket.on('update_my_user_details', function (myUserDetails) {
			self.setState({userDetails:myUserDetails});
		});
	
	
		socket.on('update_my_chat_notifications', function (notifications,userId) {
			self.setState({notifications:notifications.results});
		});
	
	
		//autoSwitch is when server adds members of an organization to a room
		socket.on('update_my_topics', function(topics, current_topic, userId, autoSwitch) {
			self.setState({topics:topics.results,currentView:"topics"},function(){
				if(current_topic){
					self.setCurrent(current_topic,"topic");
				}
			});
		});
		
		socket.on('get_orgs', function(topics){
			self.setState({orgs:topics.results,currentView:"orgs"});
		});
		
		
		socket.on('get_pending_topics', function(topics){
			self.setState({topics:topics.results,currentView:"pending"});
		});
		
		socket.on('get_archived_chats', function(topics){
			self.setState({chats:topics.results,currentView:"archive"});
		});	
		socket.on('get_subchats', function(data,belongTo,type){
			if(type=="org"){
				self.setState({chats:data.results,currentView:"orgs"});
			}else{
				self.setState({chats:data.results,currentView:"topics"});
			}
		});
		//new chat update
		socket.on('update_chat', function(chatRes, usrName, autoSwitch, belongTo) { 
			var chat=chatRes[0].messages;
			self.setCurrent(chat.id,"chat");
		});
	
		//send files
		ss(socket).on('downloadFile', function(stream,data) {
			var fileBuffer = [], fileLength=0;
			stream.on('data', function(chunk) {
				fileLength += chunk.length;
				fileBuffer.push(chunk);
			});
			stream.on('end', function(dt) {
				var filedata = new Uint8Array(fileLength),i=0;
				fileBuffer.forEach(function (buff) {
					for (var j = 0; j < buff.length; j++) {
						filedata[i] = buff[j];
						i++;
					}
				});
				downloadBlob(filedata, data, "application/octet-stream");
			});
		});
		//get topic level notifications
		socket.emit('get_my_chat_notifications');
	}
	setCurrentView(mode){
		this.setState({currentView:mode?mode:"topics",topics:[]});
		if(mode=="orgs"){
			socket.emit('get_orgs', this.state.userId);
		}else if(mode=="archive"){
			socket.emit('get_archived_chats', this.state.userId);
		}else if(mode=="pending"){
			socket.emit('get_pending_topics', this.state.userId);
		}else if(mode!="compose"){
			socket.emit('update_my_topics', this.state.userId);
		}
	}
	setSortOption(opt){
		this.setState({sortOption:opt});
	}
	setCurrent(id,type){
		if(type=="topic"){
			this.setState({currentTopic:id,chats:[],currentChat:undefined});
			socket.emit('topicDetails',id);
			if(this.state.currentView!="pending")
			socket.emit('get_subchats', id,type);
		}else if(type=="org"){
			this.setState({currentOrg:id,chats:[]});
			socket.emit('get_subchats', id,type);
		}else if(type=="chat"){
			this.setState({currentChat:id});
			socket.emit('switchRoom', id);
		}
	}
	render(){
		return (<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
			{
			(this.state.currentView=="compose")?(
				<ComposeChat
					userId={this.state.userId}
					setCurrentView={this.setCurrentView}/>
			):(
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
					<div className="col-lg-4 col-md-4 col-sm-6 col-xs-12 graybackground2  no-padding border-right">
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 hidden">
							{this.state.userId?<IconName type="user" id={this.state.userId}/>:""}
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right no-padding-left extra-padding-bottom graybackground extra-padding-top chatHeaderHeight">
							<div className="parent-img-component col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
								<div className="child-img-component ">
									<div className={this.state.currentView=="topics"?"default-nav-header h2 no-padding no-margin":"text-grey default-nav-header h5 no-margin "}>
										{
											(this.state.currentView=="topics")?(<span className="extra-padding-left">Messages</span>):
											(<div className="pointer"  onClick={this.setCurrentView.bind(null,"topics")}>
												<i className="icons8-left-arrow ">
											 	</i>
											 	<span>Messages</span>
											 </div>)
										}
										
									</div>
									<div className={this.state.currentView=="topics"?"hidden":"default-nav-header extra-padding-left"}>
											{
												this.state.currentView=="orgs"?"My Orgs":(
													this.state.currentView=="pending"?"Pending Responses":(
														this.state.currentView=="archive"?"Archived":""
													)
												)
											}
									</div>
								</div>
								<div className="child-img-component">
									<i className="icons8-email-envelope pull-right link" style={{"fontSize":"20px"}} aria-hidden="true" onClick={this.setCurrentView.bind(null,"compose")}> </i> 
										
										{/*<div className="child-img-component">
												<div className="icon-envelope pointer" data-target="#msg-composer" onClick={this.setCurrentView.bind(null,"compose")}>
													<i className="icons8-email-envelope" aria-hidden="true"> </i> 
												</div>
											</div>
											<div className="child-img-component">
		                         			 	<div className="dropdown pointer">
												  <div className="dropbtn">
												  	<i className="fa fa-ellipsis-v" aria-hidden="true"></i>
												  </div>
												  <div className="dropdown-content">
												    <li  onClick={this.setSortOption.bind(null,"date")}>Date</li>
												    <li onClick={this.setSortOption.bind(null,"topic")}>Topic</li>
												  </div>
												</div>
											</div>*/}
								
								</div>
							</div>
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 graybackground2 margin-bottom-gap-xs searchPadding">
							 <div className="searchPosition">
		    					<input type='text' ref={(e)=>{this.searchText=e}} className="form-control borderSearch"  placeholder={"Search"}/>
		    					<span className="icons8-search-filled pointer filterSearch"  />
							</div>
						</div>
						<div className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right  extra-padding-bottom add-border-bottom-pin "+(this.state.currentView=="topics"?"":"hidden") }>
							<div className="col-lg-4 col-md-4 col-sm-4 col-xs-12 no-padding text-left" onClick={this.setCurrentView.bind(null,"orgs")}>
								<span className="blueLink pointer">My Orgs</span>
							</div>
							<div className="col-lg-4 col-md-4 col-sm-4 col-xs-12 no-padding text-left" onClick={this.setCurrentView.bind(null,"pending")}>
								<span className="blueLink pointer">Pending Response</span>
							</div>
							<div className="col-lg-4 col-md-4 col-sm-4 col-xs-12 no-padding text-right" onClick={this.setCurrentView.bind(null,"archive")}>
								<span className="blueLink pointer extra-padding-right">Archived</span>
							</div>
						</div>
						
						<div className="tab-items col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding sideNavHeight">
							<TopicsView userId={this.state.userId}
									currentView={this.state.currentView}
									currentTopic={this.state.currentTopic}
									currentOrg={this.state.currentOrg}
									currentChat={this.state.currentChat} 
									topics={this.state.topics} 
									orgs={this.state.orgs} 
									chats={this.state.chats}
									setCurrent={this.setCurrent}/>
						</div>
			
					</div>
			
					<div  className="col-lg-8 col-md-8 col-sm-6 col-xs-12 no-padding-right ">
					{
						this.state.currentChat!=undefined?
							<ChatView userId={this.state.userId} currentChat={this.state.currentChat}/>
						:this.state.currentTopic!=undefined?
							<TopicView  userId={this.state.userId} currentTopic={this.state.currentTopic}/>
						:""
					}
					</div>
				</div>
			)
		}
		</div>)
	}
}



class ComposeChat extends React.Component{
	constructor(props) {
		super(props);
		this.state={};
		this.submitBroadCastMessage=this.submitBroadCastMessage.bind(this);
	}
	submitBroadCastMessage(){
		var formData = serializeFormObj($(this.compose).serializeArray());
		var flag=true;
		for(var key in formData){
			if(!formData[key]){
				flab=false;
				break;
			}
		}
		if(flag){
			socket.emit('message_to_members', formData, this.props.userId);
			this.props.setCurrentView(null,"topics");
		}else{
			alert("Please complete the form");
		}
	}
	render(){
		return (
			<div className="parent">
					<div className="row no-margin blueLink">
						<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12 link backLink" onClick={this.props.setCurrentView.bind(null,"topics")}>
							<i className="fa fa-angle-left" aria-hidden="true"></i> <span>&nbsp;Messaging</span>
						</div>
						<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
							<i className="fa fa-times pointer pull-right" data-target data-type="parent-hide" aria-hidden="true" onClick={this.props.setCurrentView.bind(null,"topics")}></i>
						</div>
					</div>
					<div  className="row no-margin">
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
							<h2>New Message</h2>
						</div>
					</div>
					<div  className="row no-margin">
						<form id="compose" ref={(e)=>{this.compose=e}} name="compose">
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<input type="text" className="form-control" name="topic" id="topic"  placeholder="Enter Topic" required/>
							</div>
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<input type="text" className="form-control" id="message" placeholder="Message" name="message" required/>
							</div>
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<input type="text" className="form-control" id="project" placeholder="Project name" name="project"/>
							</div>
			
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<input type="text" className="form-control" id="category" placeholder="Category Needed" name="category"/>
							</div>
			
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<input type="text" className="form-control" id="locationNeeded" placeholder="Location Needed" name="locationNeeded"/>
							</div>
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<input type="number" className="form-control" id="quantity" placeholder="Quantity" name="quantity"/>
							</div>
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<input type="text" className="form-control" id="needDate" placeholder="Need by Date" name="needDate"/>
							</div>
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<div className="display-inline-block extra-padding-right">
									<button type="button" className="upload-btn" onClick={this.submitBroadCastMessage}>
										Send
									</button>
								</div>
								<div className="display-inline-block extra-padding-right">
									<button type="button" data-target data-type="parent-hide" className="upload-btn" onClick={this.props.setCurrentView.bind(null,"topics")}>
										Cancel
									</button>
								</div>
							</div>
						</form>
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
		if(topic.status && topic.status[this.props.userId]){
			status=topic.status[this.props.userId];
		}
		return <div className={"col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding-left no-padding "+(this.state.currentTopic==topic.id?"":"collapsed")}  
	      		data-toggle="collapse" 
	      		data-target={divId?("#"+divId):""} 
	      		aria-expanded="true">
	            <div className="parent-img-component col-lg-12 col-sm-12 col-xs-12 col-md-12 ">
						<div className="h4 col-lg-11 col-md-11 col-sm-10 col-xs-10 no-padding no-margin" onClick={this.props.setCurrent.bind(null,topic.id,"topic")}>
							{topic.topic.substring(0,120)}
						</div>
						<div className="pull-right text-grey col-lg-1 col-md-1 col-sm-2 col-xs-2 no-padding-right">
							<CounterAndActions
								type={"topic"}
								status={status}
								id={topic.id} 
								count={(topic.counter && topic.counter[this.props.userId])?topic.counter[this.props.userId].count:0} 
								time={timeFormat(topic.createdDate)}/>
						</div>
	             </div>
	       </div>
	}
	getChatView(chat){
		var status;
		if(chat.status && chat.status[this.props.userId]){
			status=chat.status[this.props.userId];
		}
		return <div key={guid()} className={(this.state.currentChat==chat.id?"graybackground ":" ")+" row itemHover remove-margin-right"}> 
					<div className={"name1  extra-padding-top  col-lg-12 col-md-12 col-sm-12 col-xs-12"}>
						<div className="left display-inline-block" onClick={this.props.setCurrent.bind(null,chat.id,"chat")}>
							<IconName type="user" id={chat.chatFrom==this.props.userId?chat.chatTo:chat.chatFrom}/>
						</div>
						<CounterAndActions
							type={"chat"}
							status={status}
							id={chat.id} 
							count={chat.counter[this.props.userId].count} 
							time={timeFormat(chat.updatedDate)}/>
					</div>
				</div>
	}
	render(){
		var type=this.state.type;
		var self=this;
		if(this.state.currentView=="topics"){
			return <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding ">
					{
					this.state.topics.map(function(topic){
						var _isCurrent=false;
						if(self.state.currentTopic==topic.id){
							_isCurrent=true;
						}
						var id="topics"+guid();
						return <div key={guid()}  
								id={"collapse "+id} 
								className={"col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding-left no-padding-right add-border-bottom-pin extra-padding-top extra-padding-bottom "}>
                              	{self.getTopicView(topic,_isCurrent,id)}
                               <div id={id} className={"col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding "+(_isCurrent?("collapse in "):"")}>
                                    {
								    	(Array.isArray(self.state.chats) && self.state.currentTopic==topic.id)?(
								    		<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right  margin-bottom-gap-xs">
									    	{
										    	self.state.chats.map(function(chat){
										    		return self.getChatView(chat);
										    	})
										    }
										    {(self.state.chats.length==0?<span className="text-grey extra-padding-top-sm">No chats available</span>:"")}
										    </div>):""
									    }
                               </div>
                        </div>
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
								var id="orgs"+guid();
								return <div key={guid()} id={"collapse "+id} 
											className={"col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding-left no-padding-right add-border-bottom-pin extra-padding-top extra-padding-bottom "}>
			                              <div className={"col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding-right link "+(_isCurrent?"":"collapsed")}  
				                              		data-toggle="collapse" 
				                              		data-target={"#"+id} 
				                              		aria-expanded="true"
				                              		onClick={self.props.setCurrent.bind(null,org.org,"org")}>
			                                    <div className="parent-img-component col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding-left">
			                                        <div className="child-img-component">
			                                        	<IconName type="org" id={org.org}/>
			                                        </div>
			                                		<div key={guid()} className=" child-img-component no-padding">
			                                			<span className="pull-right collapseLayout icons8-expand-arrow"></span>
			                                		</div>
			                                     </div>
			                               </div>
			                               <div id={id} className={"col-lg-12 col-sm-12 col-xs-12 col-md-12 "+(_isCurrent?("collapse in"):"")}>
			                                    {
											    	(Array.isArray(self.state.chats) && self.state.currentOrg==org.org)?(
											    		<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-xs">
													    	{
														    	self.state.chats.map(function(chat){
														    		return self.getChatView(chat);
														    	})
														    }
														    {(self.state.chats.length==0?<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 text-grey  extra-padding-top-sm">No chats available</div>:"")}
													    </div>):""
											    }
			                               </div>
			                        </div>
							})
						}
					</div>
			}else if(this.state.currentView=="pending"){
				return <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding ">
						{
							this.state.topics.map(function(topic){
								return self.getTopicView(topic);
							})
						}
						</div>
			}else if(this.state.currentView=="archive"){
				return <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
						{
							this.state.chats.map(function(chat){
								return self.getChatView(chat);
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
	}
	getStateFromProps(props){
		return {
			currentChat:props.currentChat
		};
	}
	componentWillReceiveProps(nextProps){
		this.setState(this.getStateFromProps(nextProps));
	}
	handleFileSubmit(e){
		var file = e.target.files[0];
		var stream = ss.createStream();
		var opts = {size: file.size, name:file.name};
		if($(e.target).hasClass('self')){
			opts.to = $(e.target).attr('name');
			opts.from = this.props.userId;
			$('#chat_box_'+opts.to+' .conversation').append('<li className="me list-unstyled">file sent</li>');
		}
		ss(socket).emit('file', stream, opts);
		this.scrollBottom();
		ss.createBlobReadStream(file).pipe(stream);
	}
	observeEnterKeyPress(event){
		var self=this;
		var code=event.keyCode? event.keyCode:event.which;
		if(code==13){
			this.sendMessage();
		}
	}
	scrollBottom(){
		setTimeout(function(){ 
		 	$(".contentNavHeight").scrollTop($(".contentNavHeight").height());
		},2000)
	}
	sendMessage(){
		if(this.message.value.trim()){
			socket.emit('sendchat', this.props.userId, this.message.value, this.state.messages.topicId, this.state.messages.chatFrom==this.props.userId?this.state.messages.chatTo:this.state.messages.chatFrom);
	     	this.scrollBottom();
			this.message.value="";
		}	
	}
	componentDidMount(){
		var self=this;
		socket.on('update_history', function (chat, topic, userId, belongTo) {
			self.setState({messages:chat},function(){
				self.scrollBottom();
			});
		});
		 
		//new message for current chat update
		socket.on('update_chat', function(chatRes, usrName, autoSwitch, belongTo) { 
			if(self.props.userId==usrName && self.state.messages.chatFrom==belongTo){
				self.setState({messages:chatRes[0].messages});
			}
		});
	
	}
	componentDidUpdate(){
		
	}
	render(){
		var self=this;
		return (
			<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
				<div className="chat-sub-icon" data-target=".left-panes" data-type="toggle"></div>
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right no-padding-left parent-img-component extra-padding-bottom graybackground extra-padding-top chatHeaderHeight row">
						{(this.state.messages)?(
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 extra-padding-top">
								<div className="child-img-component no-margin no-padding">{(this.state.messages.topic.length>60?(this.state.messages.topic.substring(0,60)+"..."):this.state.messages.topic)+", "}</div>
								<div className="child-img-component"><IconName hideImage={true} id={this.state.messages.chatFrom==this.props.userId?this.state.messages.chatTo:this.state.messages.chatTo} type="user"/></div>
							</div>
						):""}
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding contentNavHeight">
					{
						(typeof this.state.messages=="object" && Array.isArray(this.state.messages.chat))?(
							<div className=" col-lg-12 col-sm-12 col-md-12 col-xs-12">
							{
								this.state.messages.chat.map(function(value){
									return <div key={guid()} className={((value.chatFrom!=self.props.userId)?'othersMessage':'myMessage')}>
												<div className="thread">
													<div className="chatMessage">{value.message}</div>
													<div className="chatDate">{value.date?value.date:''}</div>
												</div>
											</div>;
								})
							}
							</div>
						):""
					}
				</div>
				<div className="row col-lg-12 col-md-12 col-sm-12 col-xs-12  graybackground ">
					<div className="chat-input margin-top-gap-sm col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<input ref={(e)=>{this.message=e}} 
								className="inputMessage form-control" 
								placeholder="broadcast to room"
								onKeyPress={this.observeEnterKeyPress}/>
							<div>
								<label className="extra-padding-right">
									<i className="fa fa-reply fa-1-5x pointer filterSearch" style={{"right":"1%"}}  onClick={this.sendMessage}></i>
								</label>
								<label htmlFor="global-upload" className="extra-padding-right">
									<i style={{"right":"4%"}} className="fa fa-paperclip fa-1-5x pointer filterSearch"></i>
								</label>
								<input id="global-upload" 
									ref={(e)=>{this["globalUpload"]=e}} 
									className="file hidden" 
									type="file"
									onChange={this.handleFileSubmit}/>
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
		this.updateChatDetails=this.updateChatDetails.bind(this);
	}
	getStateFromProps(props){
		return {
			userId:props.userId,
			currentTopic:props.currentTopic
		};
	}
	componentWillReceiveProps(nextProps){
		this.setState(this.getStateFromProps(nextProps));
	}
	observeEnterKeyPress(event){
		var self=this;
		var code=event.keyCode? event.keyCode:event.which;
		if(code==13){
			this.sendMessage();
		}
	}
	componentDidMount(){
		this.updateChatDetails();
	}
	updateChatDetails(){
		var self=this;
		socket.on('update_topic_details', function (topics, topic) {
			var currentChatDetails=topics.results[0];
			var owner=(currentChatDetails.userId==self.props.userId);
			var responded=false;
			var org;
			currentChatDetails.contacted.map(function(value){
				if(!owner && value.userId==self.props.userId){
					if(value.status=='responded'){
						responded=true;
					}
					org=value.org;
				}
			})
			self.setState({
				currentChatDetails:currentChatDetails,
				owner:owner,
				responded:responded,
				org:org
			});
		});
	}
	sendMessage(){
		if(this.message.value.trim()){
			socket.emit('sendchat', this.props.userId, this.message.value, this.state.currentTopic, this.state.currentChatDetails.userId,this.state.org); 
			this.message.value="";
			this.setState({showStartConversationOptions:false});
		}	
	}
	render(){
		var self=this;
		return (
			<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
				<div className="chat-sub-icon" data-target=".left-panes" data-type="toggle"></div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right no-padding-left parent-img-component extra-padding-bottom graybackground extra-padding-top chatHeaderHeight row">
						{(this.state.currentChatDetails)?(
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 extra-padding-top">
								<div className="child-img-component no-margin no-padding">{(this.state.currentChatDetails.topic.length>60?(this.state.currentChatDetails.topic.substring(0,60)+"..."):this.state.currentChatDetails.topic)+", "}</div>
								<div className="child-img-component"><IconName id={this.state.currentChatDetails.userId} hideImage={true} type="user"/></div>
							</div>
						):""}
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding contentNavHeight">
					{
						(this.state.currentChatDetails)?(
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
								<div className="msg margin-top-gap-sm margin-bottom-gap-sm">
									<div className="display-inline-block">
									{
										this.state.currentChatDetails.userId==this.props.userId?
										"You":<IconName id={this.state.currentChatDetails.userId} hideImage={true} type="user"/>
									}</div> created the topic <strong>{this.state.currentChatDetails.topic}</strong>
								</div>
								<label>Synopsis:</label>
								<h5 className="remove-margin-top">{this.state.currentChatDetails.message}</h5>
								{
									!this.state.owner?(
										(!this.state.responded)?(
											<li className="topicStatusRow">
												<button type="button" className="btn strt-conv" onClick={()=>{this.setState({showStartConversationOptions:true})}}>Start Conversation</button>
											</li>
										):(<li className="topicStatusRow">
												<div className="msg">You started conversation</div>
											</li>
										)):""
									
								}
									
							</div>
						):("")
					}
					{
						(this.state.currentChatDetails && this.state.owner)?(
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
								<label className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
									Contacted:
								</label>
								{
									this.state.currentChatDetails.contacted.map(function(c){
										return <IconName key={guid()} id={c.userId} type={"user"}/>
									})
								}
								
								{
									this.state.currentChatDetails.contacted.map(function(value){
										if(value.name!=self.props.userId && value.status=='responsed'){
											return <li key={guid()} className="topicStatusRow">
													<div className="msg">{value.name} started conversation</div>
											</li>
										}else{
											return <li key={guid()} className="hidden"></li>
										}
									})
								}
							</div>
						):""
					}
				</div>
				{
					(this.state.showStartConversationOptions)?(
						<div className="row col-lg-12 col-md-12 col-sm-12 col-xs-12  graybackground ">
							<div className="chat-input margin-top-gap-sm col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
								<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
									<input ref={(e)=>{this.message=e}} 
										className="inputMessage form-control" 
										placeholder="broadcast to room"
										onKeyPress={this.observeEnterKeyPress}/>
									<div>
										<label className="extra-padding-right">
											<i className="fa fa-reply fa-1-5x pointer filterSearch" style={{"right":"1%"}} onClick={this.sendMessage}></i>
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
		var self=this;
		socket.on('update_chat_delete', function(id, userId) {
			if(self.state.id==id){
				self.setState({hide:true});
			}
		});
		
		socket.on('update_chat_archive', function(id,userId) {
			if(self.state.id==id){
				self.setState({hide:true});
			}
		});
		
		socket.on('update_chat_un_archive', function(id,userId) {
			if(self.state.id==id){
				self.setState({hide:true});
			}
		});
		socket.on('update_topic_delete', function(id, userId) {
			if(self.state.id==id){
				self.setState({hide:true});
			}
		});
		
		socket.on('update_topic_archive', function(id,userId) {
			if(self.state.id==id){
				self.setState({hide:true});
			}
		});
		
		socket.on('update_topic_un_archive', function(id,userId) {
			if(self.state.id==id){
				self.setState({hide:true});
			}
		});
	}
	doArchive(){
		if(this.props.type=="chat"){
			socket.emit('archiveChat', this.state.id);
		}else{
			socket.emit('archiveTopic', this.state.id);
		}
	}
	doUnArchive(){
		if(this.props.type=="chat"){
			socket.emit('unArchiveChat', this.state.id);
		}else{
			socket.emit('unArchiveTopic', this.state.id);
		}
	}
	doDelete(){
		if(this.props.type=="chat"){
			socket.emit('deleteChat', this.state.id);
		}else{
			socket.emit('deleteTopic', this.state.id);
		}
	}
	render(){
		var count=this.props.count;
		if(isNaN(count)){
			count=0;
		}
		count*1;
		if(this.state.hide){
			return <div/>
		}
		return <div className="counterAndActions display-inline-block pull-right">
			<div className="time">
				{this.props.time?this.props.time:""}
			</div>
			<div className="display-inline-block pull-right">
				{count>0?(<div className="extra-padding-right-sm display-inline-block">
								<span className="counter">
									{count}
								</span>
						  </div>):""}	
				<div className="display-inline-block">
					<div className="dropdown pointer">
						<div className="dropbtn">
							<i className="fa fa-ellipsis-v" aria-hidden="true"></i>
						</div>
						<div className="dropdown-content">
							<li onClick={this.props.status=="archived"?this.doUnArchive:this.doArchive}>{this.props.status=="archived"?"unarchive":"archive"}</li>
						    <li onClick={this.doDelete}>delete</li>
						</div>
					</div>
				</div>
			</div>
		</div>
	}
}



class NotificationsCount extends React.Component{
	constructor(props) {
		super(props);
	}
	componentDidMount(){
		var self=this;
		socket.emit('adduser', this.props.userId);
		socket.emit('get_all_my_notifications_count',this.props.userId);
	}
	render(){
		if(this.props.wrap){
			if(allNotificationsCount>0){
				return <span className="notification-count">{allNotificationsCount}</span>;
			}else{
				return <span/>
			}
		}else{
			return <span className="counter">{allNotificationsCount>0?allNotificationsCount:""}</span>;
		}
	}
}
//exports.NotificationsCount=NotificationsCount;
//exports.ChatComponent=ChatComponent;
ReactDOM.render(<ChatComponent/>,document.getElementById('root'));