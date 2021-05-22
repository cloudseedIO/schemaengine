/**
 * @author - Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var Chat=require('../Chat.jsx');
var WebAPI=require("../../utils/WebAPIUtils.js");
var linkGenerator=require('../nav/linkGenerator.jsx');
var global=require('../../utils/global.js');
var Link=require('react-router').Link;
var limitCount=global.summaryLimitCount+1;//9;

var browserHistory=require('react-router').browserHistory;
/**
 * pending chats [userId]:chat
 * all pending topic s by user [contactedPerson,org,sender]:topic
 * countByUserId userId:number
 * noResponseTopics [userId]:topic
 */
var MessagingReports=React.createClass({
	getInitialState:function(){
		return {current:null,data:[],skip:0,limit:limitCount,key:undefined};
	},
	invokeEmailTriggerForUnAttendedChats:function(){
		if(confirm("Are you sure to send emails?")){
			common.startLoader();
			WebAPI.doPost("/messaging?operation=invokeEmailTriggerForUnAttendedChats",{},function(data){
				console.log(data);
				common.stopLoader();
			});	
		}
	},
	invokeEmailTriggerForUnAttendedChatsForUser:function(userId){
		if(userId){
			common.startLoader();
			WebAPI.doPost("/messaging?operation=invokeEmailTriggerForUnAttendedChatsForUser",{userId:userId},function(data){
				console.log(data);
				common.stopLoader();
			});
		}
	},
	invokeEmailTriggerForUnAttendedTopic:function(topicId,userId){
		if(topicId && userId){
			common.startLoader();
			WebAPI.doPost("/messaging?operation=invokeEmailTriggerForUnAttendedTopic",{topicId:topicId,userId:userId},function(data){
				console.log(data);
				common.stopLoader();
			});
		}
	},
	invokeEmailTriggerForUnAttendedChat:function(chatId,userId){
		if(chatId && userId){
			common.startLoader();
			WebAPI.doPost("/messaging?operation=invokeEmailTriggerForUnAttendedChat",{chatId:chatId,userId:userId},function(data){
				console.log(data);
				common.stopLoader();
			});
		}
	},
	setCurrent:function(current){
		this.setState({
			current:current,
			data:[],
			skip:0,
			key:undefined,
			limit:limitCount
		},this.getData);
	},
	setKey:function(key){
		this.setState({
			key:key,
			skip:0,
		},this.getData);
	},
	getData:function(){
		var self=this;
		if(this.state.current){
			common.startLoader();
			var data={
				viewName:this.state.current,
				skip:this.state.skip,
				limit:this.state.limit,
				key:this.state.current=="allPendingTopicsByUser"?this.state.key:undefined
			};
			WebAPI.doPost("/messaging?operation="+this.state.current,data,function(data){
				common.stopLoader();
				if(data.error){
					alert(data.error);
				}else{
					 self.setState({data:data});
				}
			});
		}
	},
	increaseSkipCount:function(){
		this.setState({skip:this.state.skip+limitCount},this.getData);
	},
	reduceSkipCount:function(){
		this.setState({skip:this.state.skip-limitCount},this.getData);
	},
	render:function(){
		var self=this;
		if(this.state.current){
			var tableHeader=[];
			if(Array.isArray(this.state.data) && this.state.data[0] && this.state.data[0].key && this.state.data[0].value){
				if(Array.isArray(this.state.data[0].key)){
					for(var i=0;i<this.state.data[0].key.length;i++){
						tableHeader.push(<th>{i==0?"User":i==1?"Org":i=="2"?"Creator":""}</th>);
					}
				}else{
					tableHeader.push(<th>User</th>);
				}
				if(typeof this.state.data[0].value=="object" && this.state.data[0].value!=null){
					Object.keys(this.state.data[0].value).map(function(key){
						if(key!="status" && key!="counter" && key!="contacted" && key!="id" && key!="topicId")
						tableHeader.push(<th>{key}</th>);
					});
				}else{
					tableHeader.push(<th>Count</th>);
				}
			}
			return <div className="row no-margin">
				<div className="row no-margin blueLink link" onClick={this.setCurrent.bind(null,null)}>BACK TO ALL</div>
				{(this.state.current=="allPendingTopicsByUser" && this.state.key!=undefined)?(
					<div className="row no-margin blueLink link" onClick={this.setCurrent.bind(null,"allPendingTopicsByUser")}>Back To Topics waiting for response</div>
				):""}
				<div className="row no-margin">
					<h1>
						{
							this.state.current=="countByUserId"?
							"All notifications count by Users"
							:this.state.current=="noResponseTopics"?
							"All Topics that are not responded by any one"
							:this.state.current=="allPendingChats"?
							"All Chats that are waiting for reply":
							this.state.current=="allPendingTopicsByUser"?
							"Topics waiting for response"
							:this.state.current
						}
					</h1>
				</div>
				{
					this.state.current=="countByUserId"?
						<div className="row no-margin blueLink link" onClick={this.invokeEmailTriggerForUnAttendedChats}>
							<h3>Send Emails to all users who are having notifications.</h3>
						</div>
					:""
				}
				<div className="row no-margin" style={{"overflow-x":"auto"}}>
					<table>
					<tr>
						{tableHeader}
					</tr>
					{
						this.state.data.map(function(entry){
							var keyMap=[];
							if(Array.isArray(entry.key)){
								for(var i=0;i<entry.key.length;i++){
									keyMap.push(<td key={global.guid()}><Chat.IconName id={entry.key[i]} type={entry.key[i].indexOf("User")>-1?"user":"org"}/></td>);
								}
							}else{
								keyMap.push(<td key={global.guid()}><Chat.IconName id={entry.key} type={"user"}/></td>)
							}
							if(typeof entry.value=="object" && entry.value!=null){
								return (<tr key={global.guid()}>
										{keyMap}
										{
										Object.keys(entry.value).map(function(key){
											if(key!="status" && key!="counter" && key!="contacted" && key!="id" && key!="topicId"){
											return <td key={global.guid()} >
													<div className="display-inline-block extra-padding-right vertical-align-middle">
														{
															(key=="chatTo" || key=="chatFrom" || key=="userId")?(
																<Chat.IconName id={entry.value[key]} type={"user"}/>
															):(key=="org"?(
																<Chat.IconName id={entry.value[key]} type={"org"}/>
															):typeof entry.value[key]=="string"?entry.value[key]:"-")
														}
														
													</div>
												</td>
											}
										})
										}
										{
											self.state.current=="allPendingTopicsByUser"?
												<td>
													<button className="btn btn-info" 
														onClick={self.invokeEmailTriggerForUnAttendedTopic.bind(null,entry.value.id,entry.key[0])}>Send Mail</button>
												</td>
												:""
										}
										{
											self.state.current=="allPendingChats"?
												<td>
													<button className="btn btn-info" 
														onClick={self.invokeEmailTriggerForUnAttendedChat.bind(null,entry.value.id,entry.key[0])}>Send Mail</button>
												</td>
												:""
										}
									</tr>)
								}else{
									return <tr key={global.guid()} onClick={(self.state.current=="allPendingTopicsByUser" && self.state.key==undefined)?self.setKey.bind(null,entry.key):function(){}}>
											{keyMap}
											<td>{entry.value}</td>
											
											{
												self.state.current=="countByUserId"?
												<td>
													<button className="btn btn-info" 
														onClick={self.invokeEmailTriggerForUnAttendedChatsForUser.bind(null,entry.key)}>Send Mail</button>
												</td>
												:""
											}
										</tr>
								}
							})
					}
					</table>
					
					<div className="pull-right">
						{
								(self.state.skip && self.state.skip>=limitCount)?(<div className="link display-table-cell extra-padding-right " onClick={self.reduceSkipCount}>
									<div className="child-img-component no-padding"><i className="sleekIcon-leftarrow fa-2x nextPrevIcons" /></div>
									<div className="child-img-component no-padding"><span className="nextPrevIcons">PREV</span></div>
									&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
								</div>):(<span></span>)
				        }
				        {
				          	(this.state.data.length > (limitCount-1) )?(<div className="link display-table-cell" onClick={self.increaseSkipCount}>
				          				<div className="child-img-component no-padding"><span className="nextPrevIcons">NEXT</span></div>
				          				<div className="child-img-component no-padding"><i  className="sleekIcon-rightarrow fa-2x nextPrevIcons " /></div>
				          				</div>):(<span></span>)
						}
					</div>
					
					
				</div>
			</div>;
		}else{
			return <div className="row no-margin">
				<div className="row no-margin blueLink link" onClick={this.setCurrent.bind(null,"countByUserId")}>
					<h3>Get all notifications count by user.</h3>
				</div>
				<div className="row no-margin blueLink link" onClick={this.setCurrent.bind(null,"noResponseTopics")}>
					<h3>Get all Topics that have no response yet.</h3>
				</div>
				<div className="row no-margin blueLink link" onClick={this.setCurrent.bind(null,"allPendingChats")}>
					<h3>Get all Chats that are waiting for reply.</h3>
				</div>
				<div className="row no-margin blueLink link" onClick={this.setCurrent.bind(null,"allPendingTopicsByUser")}>
					<h3>Get all Topics that are not responded by a perticular person.</h3>
				</div>
			</div>;
		}
	}
});
exports.MessagingReports=MessagingReports;
/*countByUserId
noResponseTopics
allPendingChats
allPendingTopicsByUser*/