/*-----------------------------------------------------------------------------
A simple Language Understanding (LUIS) bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

var defaultMessageHandler=require('./intentImplimentations/default.js');
var discoverProducts=require('./intentImplimentations/discoverProducts.js');
var locateSuppliers=require('./intentImplimentations/locateSuppliers.js');

var askCategoryName=require('./dialogs/askCategoryName.js');
var askCityName=require('./dialogs/askCityName.js');
var askMfrName=require('./dialogs/askMfrName.js');
var askProductFilter=require('./dialogs/askProductFilter.js');

var viewProduct=require('./dialogs/viewProduct.js');
var viewSupplier=require('./dialogs/viewSupplier.js');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId:process.env.MicrosoftAppId ,
    appPassword:process.env.MicrosoftAppPassword ,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, defaultMessageHandler);

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */
if(process.env['AzureWebJobsStorage']){
	var tableName = 'botdata';
	var AzureWebJobsStorage=process.env['AzureWebJobsStorage'] ;
	var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, AzureWebJobsStorage);
	var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: true }, azureTableClient);

	bot.set('storage', tableStorage);
}
// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId || "60cdfc42-26f3-407e-b9f9-831370e83abe";
var luisAPIKey = process.env.LuisAPIKey || "0ca2fcc663ee42ce88260b7419c0ddef";
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;
// Create a recognizer that gets intents from LUIS, and add it to the bot
var recognizer = new builder.LuisRecognizer(LuisModelUrl).onEnabled(function (context, callback) {
     var enabled = context.dialogStack().length == 0;
     callback(null, true);
});;
bot.recognizer(recognizer);

// Add a dialog for each intent that the LUIS app recognizes.
// See https://docs.microsoft.com/en-us/bot-framework/nodejs/bot-builder-nodejs-recognize-intent-luis 

bot.dialog('None',defaultMessageHandler).triggerAction({
    matches: 'None'
});

bot.on('event', function(message) { 
  if(message.name == 'requestWelcomeDialog'){
    bot.beginDialog(message.address, 'None');
  }
});

bot.dialog('DiscoverProducts',discoverProducts).triggerAction({
    matches: 'Discover Products'//,
    //confirmPrompt: "This will cancel current Product lookup. Are you sure?" 
}).cancelAction('cancelDiscoverProducts', "Discover Products canceled.", {
    matches: /^(cancel|nevermind|exit)/i,
    confirmPrompt: "Are you sure exit from discovering products?"
}).reloadAction('startOver', 'Ok, starting over.', {
    matches: /^(start over|restart|re start|reload|re load|start again|start from begin|start from begining)$/i
});


bot.dialog('LocateSuppliers', locateSuppliers).triggerAction({ 
    matches: 'Locate Suppliers'//,
    //confirmPrompt: "This will cancel current suppliers lookup. Are you sure?" 
}).cancelAction('cancelLocateSuppliers', "Locate Suppliers canceled.", {
    matches: /^(cancel|nevermind|exit)/i,
    confirmPrompt: "Are you sure exit from locating suppliers?"
}).reloadAction('startOver', 'Ok, starting over.', {
    matches: /^(start over|restart|re start|reload|re load|start again|start from begin|start from begining)$/i
});




bot.dialog('askMfrName', askMfrName).cancelAction('cancelMfrSelection', "Manufacturer selection canceled.", {
    matches: /^(cancel|nevermind|exit|skip)/i,
    confirmPrompt: "Are you sure exit from manufacturer selection?"
});
bot.dialog('askCityName', askCityName).cancelAction('cancelCitySelection', "City selection canceled.", {
    matches: /^(cancel|nevermind|exit|skip)/i,
    confirmPrompt: "Are you sure exit from city selection?"
});
bot.dialog('askCategoryName', askCategoryName).cancelAction('cancelCategorySelection', "Product Category selection canceled.", {
    matches: /^(cancel|nevermind|exit|skip)/i,
    confirmPrompt: "Are you sure exit from category selection?"
});
bot.dialog('askProductFilter', askProductFilter).cancelAction('cancelProductFilters', "Product filters selection canceled.", {
    matches: /^(cancel|nevermind|exit|skip)/i,
    confirmPrompt: "Are you sure exit from filters selection?"
});



bot.dialog('viewProduct',viewProduct);
bot.dialog('viewSupplier',viewSupplier);

process.on('uncaughtException', function (error) {
	console.log({type:"uncaughtException",error:error.message,stack:error.stack});
});

