/**
 * 
 */


/**
 * @author V SAIKIRAN
 * 
 * @param eventName  -  {String} name of the event
 * @param properties -  {JSON} valid JSON
 * @param callback   -  {function} function to invoke, optional
 * 
 */
function trackThis(eventName, properties, callback){
customlogEvent(properties);
return;
	callback = (typeof callback == "function")? callback:(function(){});
	try{
		if(typeof mixpanel!="undefined"){
			mixpanel.track(eventName, properties, callback);
		}else{
			callback({"error": "mixpanel object is not available"});
		}
	}catch(err){
		
	}
}

/**
 * 
 * 
 * 
 * @param userData - {JSON} valid JSON containing attributes name, age, gender, email, phone number
 * 							JSON should contain a recordId 
 * @returns {Boolean}
 */
function userLogin(User){
	var userData={};
	try{
		userData.userId=User.recordId;
		userData["$name"] = (User.givenName+" "+(User.familyName?User.familyName:"")).trim();
		userData["$email"] = User.email;
		userData["authN"]  =  User.createdVia;
		if(typeof User.gender=="string"){
			if((User.gender[0]).toLowerCase()=="m"){
				userData.gender = "M";
			}else if((User.gender[0]).toLowerCase()=="f"){
				userData.gender = "F";
			}
		}
		if(typeof mixpanel!="undefined"){
			mixpanel.cookie.props.distinct_id=userData.userId;
			mixpanel.alias(userData.userId);
			mixpanel.identify(userData.userId);
			mixpanel.people.set(userData);
			mixpanel.set_config({cookie_expiration:1});// super properties cookie expiration (in days)
			mixpanel.track("$login", {"$distinct_id":userData.userId});
			if(User.internal){
				mixpanel.register({"$ignore":"true"});
			}
			return true;
		}else{
			return false;
		}
	}catch(err){
		return false;
	}
}

function userReopened(User){
	try{
		mixpanel.identify(User.userId);
	}catch(err){}
}

function userLogOut(){
	if(typeof mixpanel!="undefined"){
		try {
			mixpanel.set_config({cookie_expiration:1});//setting cookie expiration after user logged in
			mixpanel.track("$logout", {}, function(){
				mixpanel.cookie.clear();
			});
		} catch (e) {
			
		}
		return true;
	}else{
		return false;
	}
}


function clearTrackingCookie(){
	if(typeof mixpanel!="undefined"){
		try {
			mixpanel.cookie.clear();
		} catch (e) {
			
		}
	}
}


/*
"chat",{type:"general"}
"chat",{type:"compose",id:this.state.userId}
"chat",{type:"RFI",id:doc.recordId}
"chat",{type:"schemaName",id:id}

"invite",{inviter:"",invitee:[]}
"search",{text:text}

"summaryPage",{type:"schema",subType:""}
"detailPage",{}


"signup",{email:"",role:""}
"register"
*/
