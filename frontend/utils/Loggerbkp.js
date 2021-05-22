exports.info = function(){
	if (!process.env.DEBUG) return;

	var now = new Date(),
		header =now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() +  " [INFO]  -> ",
		args = Array.prototype.slice.call(arguments);
	args.splice(0,0,header);
	console.log.apply(console,args);
};


exports.warn = function(){
	if (!process.env.DEBUG) return;

	var now = new Date(),
		header =now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() +  " [WARN]  -> ",
		args = Array.prototype.slice.call(arguments);
	args.splice(0,0,header);
	console.log.apply(console,args);
};


exports.error = function(){
	if (!process.env.DEBUG) return;

	var now = new Date(),
		header =now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() +  " [ERROR]  -> ",
		args = Array.prototype.slice.call(arguments);
	args.splice(0,0,header);
	console.log.apply(console,args);
};

exports.debug = function(){
	if (!process.env.DEBUG) return;

	var now = new Date(),
		header =now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() +  " [DEBUG]  -> ",
		args = Array.prototype.slice.call(arguments);
	args.splice(0,0,header);
	console.log.apply(console,args);
};
