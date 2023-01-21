schemaengine Chat bot
===================
-> Chat bot can only serve  2 intents 
	1. Products discovering
	2. Locating Suppliers
	
-> When user pings chat bot with some random text
	if text contains keywords with 
		a)manufacturer name or
		b)category name or
		c)manufacturer name and category name
	chat bot identifies that user is looking for products
  
  if the text content is with
  	a)City name or
  	b)Manufacturer name and city name
  Chat bot identifies that user is looking for suppliers
 
  if none of the above mentioned kewords found in the given text
  chat bot asks for products or suppliers
  
 Discover Products
 ==================
 1) if the given text contains a manufacturer name
  chat bot will ask the user for the exact mfr name if the given mfr name matches more names in the db
 2) if the given text contains only a category name
 chat bot will ask the user for the exact category selection with the matched categories in the db
 3) In the above both cases if the exact name matches only one entity it will proceed to next question
 4) if no category or manufacturer name entered by the user
	chat bot asks for the category selection giving all the available category names to the user
 5) if category is selected chat bot next asks for the filters selection with the selected category
 6) and finally chat bot next asks for the category manufacturers if not selected already
	( in this step Chat bot internally prepares all applicable filter on the selected category
   and asks for filters selection one by one
   with an option to skip the selection with "all" )
 8) finally Chat bot responds with 9 products cards and with a more button
 9) on each Product record a button to view full Product detail is available
 10) after selecting a Product now full details will be shown along with share buttons on social networks
 
 
 Locate Suppliers
 ================
 1) if the given text contains a City name 
 	chat bot will ask the user for the exact city name if the given cityname matches more names in the db
 2) then chat bot asks for manufacturer based on the text in the given input same as in discover products
 3) finally chat bot responds with 9 suppliers and a more button
 4) on each supplier record a button to view full supplier details is available
 5) after selecting a suppliers now full details will be shown along with share buttons on social networks
 
 
 Next Steps
 ===========
 DONE) showing the product details withing the chat window instead of providing an url to the user
 DONE) If the filters has only option skiping it
 3) While discovering products with no intent in the given input 
 	asking the user to jump into catalog with Manufacturer selection or Category Selection
 	
 	look up by brands or filters
 4) customizing the chat window
 		a) removing attachments option
 		b) making scrollbars
 		
 		
 Links
 =======
 https://portal.azure.com
 https://dev.botframework.com/
 https://www.luis.ai/
 https://docs.microsoft.com/en-us/azure/cognitive-services/luis/home
