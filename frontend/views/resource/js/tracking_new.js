
function customlogEvent(ld){
 		var request = new XMLHttpRequest();
 		var ldata=data("event");
 		for(var key in ld){
 			ldata[key]=ld[key];
 		}
    request.open('POST', 'analytics', true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    request.send(JSON.stringify(ldata));
}

function logVisit() {
    var eventData = data('visit');
    logEvent(eventData);
}
 
function logClick(target) {
    var eventData = data('click');
    eventData['destination'] = this.getAttribute('href');
    logEvent(eventData);
}
 
// Send an AJAX payload to log the event
function logEvent(data) {
    var request = new XMLHttpRequest();
    request.open('POST', 'analytics', true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    request.send(JSON.stringify(data));
}
 
// Get the data you want log
function data(type) {
    return {
        type: type,
        location: window.location.href,
        referer: document.referrer,
        language: window.navigator.userLanguage || window.navigator.language,
        width: screen.width,
        height: screen.height,
        local_time: new Date(),
        returning: returning()
    };
}
 
// Utility function to see if it's a returning visitor
function returning() {
    if (docCookies.getItem("EagerELKTracking")) {
        return 1;
    }
    docCookies.setItem("EagerELKTracking", 1, Infinity);
}
 
// Kick off the process
document.addEventListener("DOMContentLoaded", logVisit);
 
// Set up other events
var elements = document.getElementsByTagName("a");
for (var i = 0; i < elements.length; i++) {
    elements[i].addEventListener("click", logClick);
}

