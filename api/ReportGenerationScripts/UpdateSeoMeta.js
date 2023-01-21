var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://52.76.7.57");//52.77.86.146");//52.76.7.57");
var ViewQuery = couchbase.ViewQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.openBucket(records);
var cbMasterBucket=cluster.openBucket(schemas);
var things={
		  "total_rows": 266,
		  "rows": [
		    {
		      "id": "Product-Accessories",
		      "key": 1,
		      "value": {
		        "title": "Building Product Accessories",
		        "description": "Catalog of building and architectural product accessories",
		        "keywords": " building architectural product accessories"
		      }
		    },
		    {
		      "id": "Product-AirConditioner",
		      "key": 1,
		      "value": {
		        "title": "Window Air Conditioner | Air Conditioning | India | Wishkarma.com",
		        "description": "Find best deals for window air conditioners, ceiling ac, cassette ac, floor standing / ductless ac, split ACs at our authorized dealers. "
		      },
		      "keywords": "lg air conditioner, commercial air conditioners, ceiling mounted air conditioner, floor mounted air conditioner, split system air conditioning, ductless air conditioning, window air conditioner, ductless mini split, split system ac, vertical window air conditioner, split air conditioning systems, split ductless ac, best central air conditioner, air conditioner without window, horizontal window air conditioner, VRF air conditioner."
		    },
		    {
		      "id": "Product-Appliances",
		      "key": 1,
		      "value": {
		        "title": "Home Kitchen appliances - refrigerator, dishwasher | India | Wishkarma",
		        "description": "Catalog of Home Kitchen Appliances - Refrigerators, Dishwashers, Ovens, Microwaves available in India",
		        "keywords": "Catalog of Home Kitchen Appliances - Refrigerators, Dishwashers, Ovens, Microwaves available in India"
		      }
		    },
		    {
		      "id": "Product-ArmChair",
		      "key": 1,
		      "value": {
		        "title": "Armchairs | Furniture | India | Wishkarma.com",
		        "description": "Catalog of Armchairs and other home furniture available in India",
		        "keywords": "Catalog of Armchairs and other home furniture available in India"
		      }
		    },
		    {
		      "id": "Product-BakingMold",
		      "key": 1,
		      "value": {
		        "title": "Baking Molds | Kitchen | India | Wishkarma.com",
		        "description": "Catalog of cake baking accessories available in India",
		        "keywords": "Baking Molds, Kitchen, Wishkarma"
		      }
		    },
		    {
		      "id": "Product-BakingTray",
		      "key": 1,
		      "value": {
		        "title": " Baking Trays | Cakes | Kitchen | Wishkarma.com",
		        "description": "Catalog of Baking Trays and other equipment available in India",
		        "keywords": " Baking Trays, Cakes, Accessories, Kitchen"
		      }
		    },
		    {
		      "id": "Product-BarCabinet",
		      "key": 1,
		      "value": {
		        "title": "Bar Cabinet | Kitchen | India | Wishkarma.com ",
		        "description": "Bar and Kitchen Cabinets available in India",
		        "keywords": "Bar and Kitchen Cabinets available in India"
		      }
		    },
		    {
		      "id": "Product-BarStool",
		      "key": 1,
		      "value": {
		        "title": "Bar Stool, Chairs, Counter | India | Wishkarma.com",
		        "description": "Catalog of Bar Stools, Chairs, Counter available in India",
		        "keywords": "Catalog of Bar Stools, Chairs, Counter available in India"
		      }
		    },
		    {
		      "id": "Product-Baskets",
		      "key": 1,
		      "value": {
		        "title": "Kitchen Baskets, Storage Racks | India | Wishkarma.com",
		        "description": "Catalog of Kitchen Baskets, Storage Racks and other accessories available in India",
		        "keywords": "Catalog of Kitchen Baskets, Storage Racks, other accessories, India"
		      }
		    },
		    {
		      "id": "Product-BathCabinate",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-BathCabinet",
		      "key": 1,
		      "value": {
		        "title": "Bath Cabinets | Bathroom Design | India | Wishkarma.com",
		        "description": "Catalog of bathroom designer cabinets available in India.",
		        "keywords": "Bath Cabinets, Bathroom Design, India"
		      }
		    },
		    {
		      "id": "Product-BathCeilingLight",
		      "key": 1,
		      "value": {
		        "title": "Bathroom Celing LED Lights | India | Wishkarma",
		        "description": "List of Bathroom Ceiling Lights and available in India.",
		        "keywords": "Bathroom Celing LED Lights"
		      }
		    },
		    {
		      "id": "Product-BathFaucet",
		      "key": 1,
		      "value": {
		        "title": "Bathroom Taps, Sink Faucets, Plumbing Hardware | India | Wishkarma.com",
		        "description": "Complete catalog of Bathroom Taps and Sink Faucets available across India. Locate our authorized suppliers and check for best prices.",
		        "keywords": "Bathroom Taps, Sink Faucets, Plumbing Hardware, India, Wishkarma"
		      }
		    },
		    {
		      "id": "Product-BathFloorTile",
		      "key": 1,
		      "value": {
		        "title": "Tile | Wall and Floor Tiles | Wishkarma",
		        "description": "Browse for wall and floor tiles for bathroom, kitchen and living rooms. Ceramics, rustic, handmade and handpainted. Some are available only at Wishkarma",
		        "keywords": "Designer tiles, modern floor tiles, white wall tiles, hand painted tiles, ceramic mosaic tiles, contemporary tiles, digital tiles, roof tiles, rustic slate floor tiles, polished tiles, wood tiles, ceramic wood tile, tropical tiles, farmhouse floor tiles."
		      }
		    },
		    {
		      "id": "Product-BathLinen",
		      "key": 1,
		      "value": {
		        "title": "Bathroom Linen, Towels, Accessories | India | Wishkarma.com",
		        "description": "Catalog of designer Bathroom Linen, Towels and Accessories available in India.",
		        "keywords": "Bathroom Linen, Towels, Accessories"
		      }
		    },
		    {
		      "id": "Product-BathMirrorLamp",
		      "key": 1,
		      "value": {
		        "title": "Bathroom Mirror Lights, LED | India | Wishkarma.com",
		        "description": "Catalogue of Bathroom Mirror Lights, Vanities from the best designers in India and across the world. Locate our authorized suppliers and check for best price.",
		        "keywords": "Bathroom Mirror Lights, LED, India, Wishkarma.com"
		      }
		    },
		    {
		      "id": "Product-BathRoomwallShelf",
		      "key": 1,
		      "value": {
		        "title": "Bathroom Shelves, Glass, Wall | India | Wishkarma.com",
		        "description": "Catalog of Bathroom Shelves available across India. Locate our authorized suppliers and check for popular designs and best prices.",
		        "keywords": "Bathroom Wall Shelves, Glass, Wall, Storage"
		      }
		    },
		    {
		      "id": "Product-BathStool",
		      "key": 1,
		      "value": {
		        "title": "Bathroom Chair, Shower Stools | India | Wishkarma.com",
		        "description": "Browse for Bathroom Chairs, Shower Stools, Benches and Seats. \nLocate our authorized suppliers and check for best price.",
		        "keywords": "Bathroom Chair, Shower Stools"
		      }
		    },
		    {
		      "id": "Product-BathWallLamp",
		      "key": 1,
		      "value": {
		        "title": "Bathroom Wall Lamps | Wishkarma.com",
		        "description": "Catalog of Bathroom Wall Lamps, store and suppliers in India",
		        "keywords": "Bathroom Wall Lamps, India, Wishkarma.com"
		      }
		    },
		    {
		      "id": "Product-BathWallTile",
		      "key": 1,
		      "value": {
		        "title": "Bathroom Wall Tiles, Kitchen Backsplash, Mosiac | India | Wishkarma.com",
		        "description": "Browse for quality wall tiles for kitchen, bathrooms available in India. Contact our suppliers for exclusive prices.",
		        "keywords": "backsplash tile, bathroom tiles, bathroom wall tiles, glass mosaic tile, kitchen tiles, kitchen wall tiles, mosaic tiles, tile backsplash, wall tiles, white wall tiles"
		      }
		    },
		    {
		      "id": "Product-BathroomAccessories",
		      "key": 1,
		      "value": {
		        "title": "Bathroom Decor, Bathroom Sets, Toilet Accessories | India | Wishkarma",
		        "description": "Catalogue of Bathroom Decor, Bathroom Sets and Toilet Accessories available in India.\nLocate our authorized suppliers and check for best prices.",
		        "keywords": "bathroom decor, bathroom sets, toilet accessories"
		      }
		    },
		    {
		      "id": "Product-BathroomWallShelf",
		      "key": 1,
		      "value": {
		        "title": "Bathroom Shelves, Glass, Wall | India | Wishkarma.com",
		        "description": "Catalog of Bathroom Shelves available across India. Locate our authorized suppliers and check for popular designs and best prices.",
		        "keywords": "Bathroom Wall Shelves, Glass, Wall, Storage"
		      }
		    },
		    {
		      "id": "Product-BathroomWallshelf",
		      "key": 1,
		      "value": {
		        "title": "Bathroom Shelves, Glass, Wall | India | Wishkarma.com",
		        "description": "Catalog of Bathroom Shelves available across India. Locate our authorized suppliers and check for popular designs and best prices.",
		        "keywords": "Bathroom Wall Shelves, Glass, Wall, Storage"
		      }
		    },
		    {
		      "id": "Product-BathtubFaucet",
		      "key": 1,
		      "value": {
		        "title": "Bathroom Tub Faucets, Freestanding, Roman | India | Wishkarma.com",
		        "description": "Catalog of Bathroom Faucets for Freestanding and Roman style Tubs available across India. Chat with experts for help in choosing the right Bathtub Faucet for you.",
		        "keywords": "Bathroom Tub Faucets, Freestanding Bathtubs, Roman Tubs"
		      }
		    },
		    {
		      "id": "Product-Bed",
		      "key": 1,
		      "value": {
		        "title": "Bed, Double, Single, King, Queen Sizes, Bunkbeds | India Wishkarma.com",
		        "description": "Catalog of Beds - Single, Double, Queen and King Sizes available across India. Chat with suppliers for help in choosing the right Bed for you.",
		        "keywords": "bed, bed frames, bedroom furniture, bunk beds, double bed, king size bed, mattress, queen size bed, single bed"
		      }
		    },
		    {
		      "id": "Product-BedBase",
		      "key": 1,
		      "value": {
		        "title": "Bed frames, Double, Single, King, Queen Sizes, Headboards | India Wishkarma.com",
		        "description": "Catalog of Bed Frames - Single, Double, Queen and King Sizes available across India. Chat with suppliers for help in choosing the right Bed frame for you.",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-BedroomSet",
		      "key": 1,
		      "value": {
		        "title": "Bedroom Furniture Sets | Home Furniture | India | Wishkarma.com",
		        "description": "Catalogue of bedroom furniture sets, headboards and bed frames available in India. Connect and chat with the dealers at the furniture stores nearby.",
		        "keywords": "bedroom furniture sets, bedroom sets, furniture stores near me, headboards, home furniture"
		      }
		    },
		    {
		      "id": "Product-BedsideTable",
		      "key": 1,
		      "value": {
		        "title": "Bedroom Furniture, Bedside Tables | India | Wishkarma.com",
		        "description": "Catalogue of Bedroom Furniture, Tables and Night Stands available in India. Connect and chat with the dealers at the furniture stores nearby.",
		        "keywords": "Bedroom Furniture, Bedside Tables"
		      }
		    },
		    {
		      "id": "Product-Bench",
		      "key": 1,
		      "value": {
		        "title": "Bench, Hallway, Upholstered, Seat, Storage | Wishkarma.com ",
		        "description": "Catalogue of Benches - Upholstered, Storage Options available in India. Connect and chat with our suppliers for best value.",
		        "keywords": "bedroom bench, bench, bench seat, bench storage, bench with storage, garden bench, outdoor bench, storage bench, storage bench seat, upholstered bench, wooden bench"
		      }
		    },
		    {
		      "id": "Product-Bidet",
		      "key": 1,
		      "value": {
		        "description": "Browse our collection of bidets including floor standing bidet, cold water bidets, hot water bidets made by various manufacturers. Chat with experts to find the right one for you. ",
		        "title": "Bidet Toilet Seat | Bathroom | India | Wishkarma.com",
		        "keywords": "bidet toilet, hand held bidet, bathroom bidet, bidet toilet seats, toilet with built in bidet, hand bidet, bidet bathroom, electronic toilet seat, attachable bidet, bathroom bidets, bidet in toilet, hand held bidets, bidet in bathroom, Bidets manufacturers, electric bidet seat."
		      }
		    },
		    {
		      "id": "Product-BidetFaucet",
		      "key": 1,
		      "value": {
		        "title": "Bidet Spray Faucets | Bathrooms | India | Wishkarma.com",
		        "description": "Search a wide variety of bathroom bidet faucets manufactured by the worlds top brands available in India. Chat with our suppliers for the best prices.",
		        "keywords": "lavatory faucets, bidet mixer, bath mixer, modern bathroom faucets, tub and shower faucets, bidet faucets, chrome faucets, brushed nickel faucets, bath sink faucets, crystal faucets, wall mount lavatory faucets, bath and shower faucet, Jaquar faucets, bathroom taps Jaquar,  kitchen faucets Jaquar, kitchen faucets, luxury bathroom faucets,valves."
		      }
		    },
		    {
		      "id": "Product-BodyJet",
		      "key": 1,
		      "value": {
		        "title": "Body Jet | Shower | Shower Accessories | India | Wishkarma.com",
		        "description": "Browse our wide range Body Jets, Shower Jets and other Accessories available in India. Contact our suppliers for special prices.",
		        "keywords": "body jet, body jet shower, shower accessories, shower body jets, shower jets"
		      }
		    },
		    {
		      "id": "Product-BookCase",
		      "key": 1,
		      "value": {
		        "title": "Bookshelf, Bookcase | Living Rooms | India | Wishkarma.com",
		        "description": "Browse our catalogue of bookshelves and bookcases available at a store near you. Contact our suppliers for the best prices. ",
		        "keywords": "bookshelf, corner bookcase, corner bookshelf, ladder bookshelf, small bookcase, solid wood bookcases, wall bookshelves, wood bookcases"
		      }
		    },
		    {
		      "id": "Product-BottleRack",
		      "key": 1,
		      "value": {
		        "title": "Wine Cabinet, holder, rack | Storage Furniture | India | Wishkarma.com",
		        "description": "Check out our collection of wine racks and cabinets available in India. Contact our suppliers for the best prices.",
		        "keywords": "bottle drying rack, metal wine rack, small wine rack, wall wine rack, wine bottle rack, wine cabinet, wine glass rack, wine holder, wine rack\nwine rack furniture, wine racks for sale, wine shelf, wine storage racks, wooden wine racks\n"
		      }
		    },
		    {
		      "id": "Product-BottleStopper",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-BottleTrap",
		      "key": 1,
		      "value": {
		        "title": "Bottle Trap | Bathroom Accessories | India | Wishkarma.com",
		        "description": "Browse our listing of Bottle Traps for your designer wash basins. Connect and chat with our suppliers for the best price and availablity.",
		        "keywords": "Bottle Trap, Bathroom Accessories"
		      }
		    },
		    {
		      "id": "Product-Bowl",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-BreadBasket",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-BrushHolder",
		      "key": 1,
		      "value": {
		        "title": "Toilet Brush Holder | Toilet Cleaning Brush | India | Wishkarma.com",
		        "description": "Browse our collection of Toilet Brush Holders available at our suppliers. ",
		        "keywords": "Toilet Brush Holder, Toilet Cleaning Brush"
		      }
		    },
		    {
		      "id": "Product-Bulb",
		      "key": 1,
		      "value": {
		        "title": "LED Bulbs & Lights | India | Wishkarma.com",
		        "description": "Catalog of Bulbs and Lights - LED, Halogen, CFL etc. available across India. Chat with suppliers for the best price.",
		        "keywords": "bulbs india, led bulbs, led bulbs online, led light bulbs, led lights, led lights online, led lights price, light bulb"
		      }
		    },
		    {
		      "id": "Product-BunkBed",
		      "key": 1,
		      "value": {
		        "title": "Bunk Beds for Kids | Furniture | India | Wishkarma.com",
		        "description": "",
		        "keywords": "Bunk Beds, Loft Beds, Kids Furniture, India, Wishkarma"
		      }
		    },
		    {
		      "id": "Product-ButterDish",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Cakepan",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Carpet",
		      "key": 1,
		      "value": {
		        "title": "Carpet & Area Rugs | India | Wishkarma.com",
		        "description": "Browse our catalogue of Carpets & Area Rugs available in India. Chat with our suppliers for the best price.",
		        "keywords": "Carpet, Area Rugs, India, Wishkarma.com"
		      }
		    },
		    {
		      "id": "Product-Ceiling",
		      "key": 1,
		      "value": {
		        "title": "Ceiling Tiles For Aoustic Use & Drop Ceiling | India | Wishkarma",
		        "description": "Browse through our collection of ceiling tiles, planks, panels in different styles - casual, traditional for home, office, commercial complexes.",
		        "keywords": "ceilings, grid ceiling, ceiling panels, drop ceiling, ceiling designs for homes, ceiling panel, decorative ceiling, drop ceiling tiles, ceiling board, tin ceiling tiles, kitchen ceilings, drop ceiling tile, ceiling planks, drop ceilings, dropped ceiling tiles, decorative drop ceiling tiles, chanakya technologies aluminum tiles."
		      }
		    },
		    {
		      "id": "Product-Chair",
		      "key": 1,
		      "value": {
		        "title": "Chairs - Dining, Office, Easychair, Lounge | India | Wishkarma",
		        "description": "Browse a wide selection of Chairs - Dining, Office, Easychair, Lounge in different designs. Chat with our suppliers for the best prices.",
		        "keywords": "Chairs - Dining, Office, Easychair, Lounge, upholstered chairs, club chair, swivel chairs, side chair, high back dining chairs, cane dining chairs, small armchairs, dining room chair, black armchair, white leather dining chairs, lounge chairs outdoor, fabric dining chairs, red dining chairs, French dining chairs, DARSHANLILA chairs ."
		      }
		    },
		    {
		      "id": "Product-ChandelierLight",
		      "key": 1,
		      "value": {
		        "title": "Chandelier Lamp Lighting - crystal, contemporary, modern, pendant | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Chadelier lamps available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "chandelier, chandelier lamp, chandelier lighting, contemporary chandeliers, crystal chandelier, glass chandelier, hanging lamps, kitchen chandelier, modern lighting, pendant lighting, small chandeliers, wood chandelier"
		      }
		    },
		    {
		      "id": "Product-ChestsOfDrawer",
		      "key": 1,
		      "value": {
		        "title": "Chest of Drawers Dressers | Bedroom Dressers | India | Wishkarma.com",
		        "description": "Browse our curated collection of Chest of Drawers Dressers, Bedroom Dressers available in India. \nChat with our suppliers for the best prices.",
		        "keywords": "bedroom dressers, bedroom furniture, chest of drawers, chester drawers"
		      }
		    },
		    {
		      "id": "Product-Chimney",
		      "key": 1,
		      "value": {
		        "title": "Hood | Kitchen Range, Exhaust Gas Chimney | India | Wishkarma.com",
		        "description": "Browse our catalogue of Kitchen Range Hoods by Indian and international manufacturers. Connect with our suppliers for the best price.",
		        "keywords": "chimney, exhaust hood, gas chimney, hood, kitchen, exhaust hood, kitchen hood, range hood"
		      }
		    },
		    {
		      "id": "Product-Coaster",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-CocktailShaker",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-CoffeeMaker",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-CoffeeTable",
		      "key": 1,
		      "value": {
		        "title": "Coffee Table - Side, Glass, round, end | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Coffee Tables available in India. Our selection includes side and end tables. Connect and chat with our suppliers for the best prices.",
		        "keywords": "coffee table, end tables, glass coffee table, round coffee table, side table."
		      }
		    },
		    {
		      "id": "Product-CoffeeTeaPot",
		      "key": 1,
		      "value": {
		        "title": "teapot, coffepot | India | Wishkarma.com",
		        "description": "Browse our catalogue of all teapots, cooffee pots in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "cast iron teapot, coffee pot, coffee tea pot, glass teapot, tea set, teapot, teapot set, teapots for sale."
		      }
		    },
		    {
		      "id": "Product-ColorAndGlossEnhancers",
		      "key": 1,
		      "value": {
		        "title": "Glass Cleaner, Upholster Cleaner, Car Wax | India | Wishkarma",
		        "description": "Browse our catalogue of all upholster cleaners, glass cleaners & Car waxes available in India.Connect and chat with our suppliers for the best prices.",
		        "keywords": "car cleaning, car polish\ncar upholstery cleaner, car wax, glass cleaner, upholstery cleaner."
		      }
		    },
		    {
		      "id": "Product-ComputerCabinet",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-CookieJar",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-CookingRange",
		      "key": 1,
		      "value": {
		        "title": "Gas Stove, Cooking Range, electric | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Cooking Ranges, Gas & Electric Stoves available in India.Connect and chat with our suppliers for the best prices.",
		        "keywords": "cooking ranges, electric stove, gas stove, range stove."
		      }
		    },
		    {
		      "id": "Product-Cushion",
		      "key": 1,
		      "value": {
		        "title": "Cushion - Covers, Sofa, Chair, Seat, floor | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Cushions  available in India. Our selection includes covers and seats. Connect and chat with our suppliers for the best prices.",
		        "keywords": "cushions, chair cushions, cushion covers, cushion covers online, cushions online, floor cushions, seat cushions, sofa cushion covers, sofa cushions."
		      }
		    },
		    {
		      "id": "Product-CutlerySet",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-CuttingBoard",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-DayBed",
		      "key": 1,
		      "value": {
		        "title": "Bedroom Furniture - Headboards, bedroom sets, daybeds| India | Wishkarma",
		        "description": "Browse our catalogue of all Bedroom Furniture, daybeds & trundlebeds available in India.Connect and chat with our suppliers for the best prices.",
		        "keywords": "bedroom furniture, day bed, daybed with trundle."
		      }
		    },
		    {
		      "id": "Product-Decanter",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-DiningChair",
		      "key": 1,
		      "value": {
		        "title": "Chairs - Diningroom Furniture, diningroom chairs, | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Chairs, diningroom chairs, dining chairs & Kitchen chairs available in India.Connect and chat with our suppliers for the best prices.",
		        "keywords": "chairs, dining chairs, dining room chairs, diningroom furniture,Kitchen chairs."
		      }
		    },
		    {
		      "id": "Product-DiningTable",
		      "key": 1,
		      "value": {
		        "title": "Dining table - Furniture stores, round diningroom tables | India | Wishkarma",
		        "description": "Browse our catalogue of all Dining table, furniture stores & round diningroom tables available in India.Connect and chat with our suppliers for the best price",
		        "keywords": "dining room tables, dining tables, furniture stores, kitchen tables, round dining tables, small dining tables."
		      }
		    },
		    {
		      "id": "Product-DishWasher",
		      "key": 1,
		      "value": {
		        "title": "Dishwashers - Dish washing machines, portable dishwashers, | India | Wishkarma",
		        "description": "Browse our catalogue of all Dishwashers, dishwashing machines & best dishwashers available in India.Connect and chat with our suppliers for the best prices.",
		        "keywords": "best dishwashers, dishwashers, dishwasher machines, portable dishwashers."
		      }
		    },
		    {
		      "id": "Product-DisplayCabinet",
		      "key": 1,
		      "value": {
		        "title": "Display Cabinets, cases, units | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Display cabinets, cases & units available in India.Connect and chat with our suppliers for the best prices.",
		        "keywords": "display cabinets, display cases, display units, glass cabinets, glass display cabinets."
		      }
		    },
		    {
		      "id": "Product-Diverter",
		      "key": 1,
		      "value": {
		        "title": "Shower Diverters, diverters, diverter Valves | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Shower Diverters, diverter valves available in India.Connect and chat with our suppliers for the best prices.",
		        "keywords": "shower diverters, diverters, diverter valves."
		      }
		    },
		    {
		      "id": "Product-Door",
		      "key": 1,
		      "value": {
		        "title": "Doors, front doors, wooden doors | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Doors, front doors, sliding doors, wooden front doors available in India.Connect and chat with our suppliers for the best prices.",
		        "keywords": "doors, front doors, interior doors, sliding doors, sliding glass doors, wooden doors."
		      }
		    },
		    {
		      "id": "Product-DoorAccessories",
		      "key": 1,
		      "value": {
		        "title": "Door Accessories, door closers, door stopers | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Door Accessories, door closers & door stoppers available in India.Connect and chat with our suppliers for the best prices.",
		        "keywords": "door accessories, door closer, door stoppers."
		      }
		    },
		    {
		      "id": "Product-DoorHandle",
		      "key": 1,
		      "value": {
		        "title": "Door Handles, door knobs | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Door handles, door knobs & pull handles available in India.Connect and chat with our suppliers for the best prices.",
		        "keywords": "door handles, brass door handles, brass handles, door knobs, glass door handles, handles for doors, kitchen door handles."
		      }
		    },
		    {
		      "id": "Product-DoorHinge",
		      "key": 1,
		      "value": {
		        "title": "Door hinges - Hinges, brass | India | Wishkarma.com",
		        "description": "Browse our catalogue of all door hinges available in India. Our selection includes hinges, brass hinges. Connect and chat with our suppliers for the best prices.",
		        "keywords": "hinges, brass hinges, butt hinge, door hinges."
		      }
		    },
		    {
		      "id": "Product-DoorSystem",
		      "key": 1,
		      "value": {
		        "title": "Door Systems - Sliding, Swing, Automatic, Folding | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Door systems available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "sliding door systems, swing door systems, automatic door system, folding door system."
		      }
		    },
		    {
		      "id": "Product-DoubleBed",
		      "key": 1,
		      "value": {
		        "title": "Double bed - Wooden, metal, divan, with mattress | India | Wishkarma",
		        "description": "Browse our catalogue of all Double beds, wooden, metal, divan & With mattress available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "double bed, divan beds, double beds with mattress, double size bed, metal double beds, small double bed, wooden double beds."
		      }
		    },
		    {
		      "id": "Product-Drawer",
		      "key": 1,
		      "value": {
		        "title": "drawer, chest of drawers | India | Wishkarma.com",
		        "description": "Browse our catalogue of all drawers, cheast of drawers in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "cabinet drawers, cabinet with drawers, chest of drawers, drawer, drawer tracks, drawer unit, kitchen cabinet, drawer slides, kitchen drawer runners, storage drawers, wooden drawer slides."
		      }
		    },
		    {
		      "id": "Product-Dresser",
		      "key": 1,
		      "value": {
		        "title": "Dresser - bedroom furniture, with mirror | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Dressers, bedroom furniture, with mirrors available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bedroom dressers, bedroom furniture, dressers, dresser with mirror, white dressers."
		      }
		    },
		    {
		      "id": "Product-Dryers",
		      "key": 1,
		      "value": {
		        "title": "Dryer machines, clothes dryers, tumble, electric | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Dryers, dryer machines, tumble and electric drayers available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "cloth dryer, clothes dryer, dryer machines, electric clothes dryer, tumble dryer, washer dryer."
		      }
		    },
		    {
		      "id": "Product-EasyChair",
		      "key": 1,
		      "value": {
		        "title": "Easy Chair - Chair,recliner, Rocking| India | Wishkarma.com",
		        "description": "Browse our catalogue of all Easy chair, recliner chair, rocking chair, available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "adirondack chairs, chairs, comfortable chairs, easychairs, recliner, rocking chairs."
		      }
		    },
		    {
		      "id": "Product-EggCup",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-ElectricCooker",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-ElectricShower",
		      "key": 1,
		      "value": {
		        "title": "Electric shower - Best electric shower| India | Wishkarma.com",
		        "description": "Browse our catalogue of all Electric showers, rain showers, shower heads available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "electric shower prices, electric shower sale, electric showers, power shower, triton showers."
		      }
		    },
		    {
		      "id": "Product-ExecutiveChair",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Fan",
		      "key": 1,
		      "value": {
		        "title": "Fan - Cooling, Remote Controlled, portable | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Fans, remote controlled fans, portable & cooling fans available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "best fan, cooling fan, cooling fan for home, electric fan, fan, fans online, portable fan, black ceiling fan with light, ceiling fan with light, stainless steel ceiling fan,  residential ceiling fans, Bajaj ceiling fans, orient electric fans."
		      }
		    },
		    {
		      "id": "Product-Faucet",
		      "key": 1,
		      "value": {
		        "title": "Faucet - Kitchen, bathroom, shower, delta, water | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Faucets, kitchen, bathroom, shower,delta, water faucets available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bathroom faucets, delta faucets, faucet, kitchen faucets, kitchen sink faucets, shower faucets, sink faucets, water faucets."
		      }
		    },
		    {
		      "id": "Product-FaucetSpares",
		      "key": 1,
		      "value": {
		        "title": "Faucet repair parts, delta shower fauct parts | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Water faucet parts, delta shower fauct parts available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "Water faucet parts, delta shower faucet parts, faucet repair parts, shower valve repairs."
		      }
		    },
		    {
		      "id": "Product-Flask",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-FloorLamp",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-FloorTile",
		      "key": 1,
		      "value": {
		        "title": "Floor tiles - Tiles, bathroom, kitchen, ceramic, white | India | Wishkarma",
		        "description": "Browse our catalogue of all floor tiles, tiles, bathroom, kitchen and ceramic tiles available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bathroom floor tiles, bathroom tiles, ceramic tile, floor tiles, kitchen tiles, tile, tile floorings."
		      }
		    },
		    {
		      "id": "Product-Flooring",
		      "key": 1,
		      "value": {
		        "title": "Flooring - laminate, wood, vinyl, bamboo, kitchen | India | Wishkarma",
		        "description": "Browse our catalogue of all floorings, wooden, laminate, vinyl, bamboo, kitchen available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bamboo flooring, engineered wood flooring, flooring, hardwood flooring, kitchen flooring, laminates, laminate flooring, laminate wood flooring, vinyl flooring, wood floorings."
		      }
		    },
		    {
		      "id": "Product-FlushPlate",
		      "key": 1,
		      "value": {
		        "title": "Toilet Flush Plates | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Toilet Flush Plates available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "Grohe flush plates, toilet flush plates."
		      }
		    },
		    {
		      "id": "Product-FlushTank",
		      "key": 1,
		      "value": {
		        "title": "Toilet Flush Tanks, Toilet Parts | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Toilet Flush tanks, toilet parts available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "flush tank, toilets, toilet flush, toilet flush valve, toilet tanks."
		      }
		    },
		    {
		      "id": "Product-FlushingSystems",
		      "key": 1,
		      "value": {
		        "title": "Toilet Flus Valve, Toilet Flush | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Toilet Flushing Systems, toilet flush available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "dual flush toilet, flush toilet, toilet flush, toilet flush system, toilet flush valve, toilet parts."
		      }
		    },
		    {
		      "id": "Product-FoodStorage",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-FootStool",
		      "key": 1,
		      "value": {
		        "title": "Footstool, step Stool, footrest | India | Wishkarma.com",
		        "description": "Browse our catalogue of all Foot Stools, foot rests, Step Stools available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "foot rest, footstool, footstools for sale, round footstool, small footstool, step stool, storage footstool."
		      }
		    },
		    {
		      "id": "Product-FruitBowl",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-FurnitureAccessories",
		      "key": 1,
		      "value": {
		        "title": "furniture accessories, home decor | India | Wishkarma.com",
		        "description": "Browse our catalogue of all door accessories, home decor available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "furniture accessories, home accessories, home decor, home decor online, home decor online shopping, online furniture shopping."
		      }
		    },
		    {
		      "id": "Product-FurnitureHinge",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-GarabageDisposal",
		      "key": 1,
		      "value": {
		        "title": "garbage disposal,insinkerator | India | Wishkarma.com",
		        "description": "Browse our catalogue of all garbage disposal, insinkerator available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "badger garbage disposal, best garbage disposal, garbage disposal, insinkerator."
		      }
		    },
		    {
		      "id": "Product-Glass",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-GratedCheeseBowl",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Grater",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-GrillPan",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Grouts",
		      "key": 1,
		      "value": {
		        "title": "grout, epoxy grout, tile grout, cement grout | India | Wishkarma.com",
		        "description": "Browse our catalogue of all grout, epoxy grout, tile grout available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "best grout, cement grout, epoxy grout, grout, grouting tile, laticrete grout, tile grout."
		      }
		    },
		    {
		      "id": "Product-HairDryerHolder",
		      "key": 1,
		      "value": {
		        "title": "hair dryer holder, hair dryer stand | India | Wishkarma.com",
		        "description": "Browse our catalogue of all hair dryer holder, hair dryer stand available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "blow dryer holder, hair dryer holder, hair dryer holder wall mount, hair dryer stand, wall mounted hair dryer, wall mounted hair dryer holder."
		      }
		    },
		    {
		      "id": "Product-HandShower",
		      "key": 1,
		      "value": {
		        "title": "hand shower, bathroom showers | India | Wishkarma.com",
		        "description": "Browse our catalogue of all hair dryer holder, hair dryer stand available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bathroom showers, hand showers, shower fittings, shower units."
		      }
		    },
		    {
		      "id": "Product-HandShowerHolder",
		      "key": 1,
		      "value": {
		        "title": "hand shower holder, shower head holder | India | Wishkarma.com",
		        "description": "Browse our catalogue of all hand shower holders, shower head holders available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "hand shower bracket, hand shower holder, shower head bracket, shower head holder, shower holder."
		      }
		    },
		    {
		      "id": "Product-HealthFaucet",
		      "key": 1,
		      "value": {
		        "title": "health faucet| India | Wishkarma.com",
		        "description": "Browse our catalogue of all health faucets available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "faucet, health faucet, health faucet jaguar, health faucet online, health faucet price, jaquar health faucet, jaquar sanitary."
		      }
		    },
		    {
		      "id": "Product-Hinge",
		      "key": 1,
		      "value": {
		        "title": "hinge, door hinges, shutter hinges | India | Wishkarma.com",
		        "description": "Browse our catalogue of all hinges, door hinges, shutter hinges, door hardware available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "hinge, cabinet door hinges, cabinet hardware, cabinet hinges, door hinges, furniture hinges."
		      }
		    },
		    {
		      "id": "Product-Hob",
		      "key": 1,
		      "value": {
		        "title": "hob, induction hob, gas hob, electric hob, kitchen hob | India | Wishkarma",
		        "description": "Browse our catalogue of all hobs, induction hobs, gas and kitchen hobs available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "hob, 5 burner gas hob, built in hob, ceramic hob, cooker hob, electric ceramic hob, electric hob, electric induction hob, gas hob, induction hob, kitchen hob, kitchen hob price."
		      }
		    },
		    {
		      "id": "Product-Hydralic",
		      "key": 1,
		      "value": {
		        "title": "hinge - hydraulic, cabinet, kitchen, concealed | India | Wishkarma.com",
		        "description": "Browse our catalogue of all hinges, hydraulic , cabinet , kitchen , concealed hinges available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "hinge,cabinet hinges, concealed hinges, cupboard hinges, door hinges, glass door hinges, hydraulic hinges, kitchen hinges, soft close hinges."
		      }
		    },
		    {
		      "id": "Product-IceBucket",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Jug",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-KidsBedroomAccessories",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-KidsBedroomSet",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-KidsChair",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-KidsLighting",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-KidsSofaAndArmChair",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-KidsTable",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-KidsTextile",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-KingAndQueenBed",
		      "key": 1,
		      "value": {
		        "title": "king and queen bed, king size bed, queen size bed | India | Wishkarma",
		        "description": "Browse our catalogue of all king and queen bed, king size bed, queen size bed available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "king and queen bed,bed sizes, double bed size, king bed, king size bed, king size mattress, queen bed, queen size bed, queen size bed frame, queen size mattress, twin bed."
		      }
		    },
		    {
		      "id": "Product-KitchenAccessories",
		      "key": 1,
		      "value": {
		        "title": "kitchen accessories | India | Wishkarma",
		        "description": "Search for all types of kitchen sink accessories like clamp, kitchen roll holder, pullout wicker basket, dinner set basket.",
		        "keywords": "baskets, tall unit, kitchen scales, pullouts, waste basin, hanging accessories, cutlery organizers, wicker basket, kitchen D tray, basket clip, kitchen glass rack, shutter bin basket, Kitchen caddie, dish dryer basket, dish rack."
		      }
		    },
		    {
		      "id": "Product-KitchenApron",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-KitchenBasket",
		      "key": 1,
		      "value": {
		        "title": "kitchen baskets, modular kitchen baskets | India | Wishkarma",
		        "description": "Browse our catalogue of all kitchen baskets, modular kitchen baskets available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "kitchen baskets, kitchen baskets online, kitchen baskets prices, kitchen storage baskets, modular kitchen baskets, ss kitchen basket, storage baskets."
		      }
		    },
		    {
		      "id": "Product-KitchenDrawer",
		      "key": 1,
		      "value": {
		        "title": "kitchen drawers, kitchen drawer organizer | India | Wishkarma.com",
		        "description": "Browse our catalogue of kitchen drawers, kitchen drawer organizers available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "cabinet drawers, cabinet with drawers, cupboard drawers, drawer boxes, drawer organizer, kitchen cabinet drawers, kitchen cabinets with drawers, kitchen drawer inserts, kitchen drawer organizer, kitchen, drawer organizers, kitchen drawer units, kitchen drawers."
		      }
		    },
		    {
		      "id": "Product-KitchenFaucet",
		      "key": 1,
		      "value": {
		        "title": "kitchen faucets | India | Wishkarma.com",
		        "description": "Browse our catalogue of kitchen faucets, moen kitchen faucets available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "best kitchen faucets, black kitchen faucets, delta faucets, delta kitchen faucets, faucet, kitchen faucets, kitchen sink faucets, modern kitchen faucets, moen faucets, moen kitchen faucets, pull down kitchen faucet, sink faucets, wall mount kitchen faucet."
		      }
		    },
		    {
		      "id": "Product-KitchenKnife",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Kitchentong",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-KnifeBlock",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-KnifeSet",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Knob",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-LEDShower",
		      "key": 1,
		      "value": {
		        "title": "Best Shower Head | Shower Wall Panels | Wishkarma",
		        "description": "Browse a wide range of best shower heads, shower trays, steam showers, glass shower panels, and overhead showers with different colors.",
		        "keywords": "overhead rain showers, handheld shower head, delta shower heads, overhead showers ,led showers, steam showers, shower screens, shower heads, luxury steam showers, slimline shower head, shower screens for baths, framed shower screens, caroma shower, screen shower, luxury showers, steam shower at home, steam bath manufacturer, low flow shower heads."
		      }
		    },
		    {
		      "id": "Product-Ladle",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Laminate",
		      "key": 1,
		      "value": {
		        "title": "laminate | India | Wishkarma.com",
		        "description": "Browse our catalogue of laminate, laminate fllorings available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "grey laminate flooring, laminate, laminate flooring, laminate flooring prices, laminate flooring sale, laminate wood flooring, waterproof laminate flooring, wood laminate."
		      }
		    },
		    {
		      "id": "Product-LaminateFlooring",
		      "key": 1,
		      "value": {
		        "title": "laminite flooring | India | Wishkarma.com",
		        "description": "Find wide range of laminates floorings catalogues of various manufacturers across India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "best laminate flooring, flooring laminate, grey laminate flooring, hardwood, laminate, laminate flooring, laminate flooring cost, laminate flooring prices, wood, laminate, wood laminate flooring."
		      }
		    },
		    {
		      "id": "Product-Lamp",
		      "key": 1,
		      "value": {
		        "title": "lamp | India | Wishkarma.com",
		        "description": "Browse our catalogue of all lamps, table lamps, floor lamps, wall, ceiling lamps available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bedroom lamps, bedside lamps, ceiling lights, chandelier, crystal lamps, desk lamp, floor lamps, glass table lamps, hanging lamps, lamp, lamp table, \nlighting, nightstand lamps, small lamps, standard lamps, standing lamps, table lamps, table light, touch lamp, wall lamps."
		      }
		    },
		    {
		      "id": "Product-LaundryBasket",
		      "key": 1,
		      "value": {
		        "title": "laundry basket| India | Wishkarma.com",
		        "description": "Browse our catalogue of all laundry baskets, hampers available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "clothes basket, hamper, hamper basket, large laundry basket, laundry basket, laundry basket online, laundry cart, laundry hamper, linen baskets, white laundry basket."
		      }
		    },
		    {
		      "id": "Product-LaundryRoomCabinet",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Lid",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Light",
		      "key": 1,
		      "value": {
		        "title": "light | India | Wishkarma.com",
		        "description": "Browse our catalogue of all lights, outdoor, portable lights available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "industrial lighting, light poles, portable lights, suspension lights, exterior light fixtures, contemporary pendant lighting, outdoor rope lights, pink rope lights, flat led rope lights, patio solar lights, decorative patio lights, bedroom floor lights, vintage ceiling lights, bathroom spotlights, spotlights ceiling, ORIENT electric lights."
		      }
		    },
		    {
		      "id": "Product-LiquidSoapDispenser",
		      "key": 1,
		      "value": {
		        "title": "liquid soap dispenser | India | Wishkarma.com",
		        "description": "Browse our catalogue of all liquid soap dispenses available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "automatic soap dispenser, foaming hand soap dispenser, hand soap dispenser, hand wash dispenser, kitchen soap dispenser, liquid soap dispenser, soap dispenser, soap dispenser pump, soap dispenser set, soap dispenser wall mounted, wall mounted liquid soap dispenser, wall mounted soap dispenser."
		      }
		    },
		    {
		      "id": "Product-LivingRoomAccessories",
		      "key": 1,
		      "value": {
		        "title": "Modern Living Room Accessories | Wishkarma",
		        "description": "A massive collection of designer living room accessories swing door operator, door guards, floor springs and more in wishkarma.",
		        "keywords": "sliding door systems, swing door systems, tower bolts, hinges, door stoppers, dorma living room accessories, tower bolt, stainless steel hinges, floor mounted door stop, floor springs, dorma door closer, GEZE Boxer, GEZE floor mounted door closer."
		      }
		    },
		    {
		      "id": "Product-Lock",
		      "key": 1,
		      "value": {
		        "title": "lock, smart lock, door lock, furniture locks | India | Wishkarma.com",
		        "description": "Browse our catalogue of all locks, smart lock, door locks available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "lock, automatic door lock, bedroom door lock, best door locks, deadbolt, deadbolt lock, digital door lock, digital lock, door handle lock, door handles and locks, door latch, door latch lock, door lock, door lock price, electric door lock, electronic door locks, front door locks, keyless door lock, keypad lock, lock apps, locks for doors, remote door lock, security door locks, security lock, sliding door lock, smart door locks, smart lock."
		      }
		    },
		    {
		      "id": "Product-LoungeChair",
		      "key": 1,
		      "value": {
		        "title": "lounge chair | India | Wishkarma.com",
		        "description": "Browse our catalogue of all lounge chairs, outdoor chairs, eames lounge chair available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "chaise lounge, folding lounge chair, lounge chair, lounge chair ottoman, lounge furniture, modern lounge chair, outdoor chairs, outdoor lounge chairs, sun lounger chairs."
		      }
		    },
		    {
		      "id": "Product-MassageChair",
		      "key": 1,
		      "value": {
		        "title": "massage chair | India | Wishkarma.com",
		        "description": "Browse our catalogue of all massage chair, chair massage available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "back massage chair, best massage chair, body massager chair, chair massage, electric massage chair, full body massage chair, japanese massage chair, massage chair, massage chair for sale, massage chair price, recliner massage chair, robotic massage chair."
		      }
		    },
		    {
		      "id": "Product-Matress",
		      "key": 1,
		      "value": {
		        "title": "mattress | India | Wishkarma.com",
		        "description": "Browse our catalogue of all mattress  available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bed mattress, best mattress, buy mattress online, cheap mattresses, double mattress, foam mattress, full mattress, full size mattress, king mattress, king size mattress, latex mattress, mattress, mattress firm, mattress online, mattress price, mattress sale, mattress stores, mattress warehouse, mattress world, pillow top mattress, queen mattress, queen size mattress, single bed mattress, single mattress, twin mattress, twin size mattress."
		      }
		    },
		    {
		      "id": "Product-Matresses",
		      "key": 1,
		      "value": {
		        "title": "mattress | India | Wishkarma.com",
		        "description": "Browse our catalogue of all mattress  available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bed mattress, best mattress, buy mattress online, cheap mattresses, double mattress, foam mattress, full mattress, full size mattress, king mattress, king size mattress, latex mattress, mattress, mattress firm, mattress online, mattress price, mattress sale, mattress stores, mattress warehouse, mattress world, pillow top mattress, queen mattress, queen size mattress, single bed mattress, single mattress, twin mattress, twin size mattress."
		      }
		    },
		    {
		      "id": "Product-MeetingTable",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-MiniFridge",
		      "key": 1,
		      "value": {
		        "title": "mini refrigerator, small refrigerator | India | Wishkarma.com\n",
		        "description": "Browse our catalogue of all mini fridges, refrigerators, small refrigerators available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "best mini fridge, cheap mini fridge, compact fridge, compact refrigerator, mini fridge, mini fridge cheap, mini fridge online, mini fridge price, mini fridge sale, mini fridge with freezer, mini refrigerator, mini refrigerator price, mini refrigerator with freezer, small fridge, small fridge for sale, small fridge freezer, small fridge price, small refrigerator, small refrigerator for sale, small refrigerator price."
		      }
		    },
		    {
		      "id": "Product-Mirror",
		      "key": 1,
		      "value": {
		        "title": "mirror, wall mirrors, bathroom mirrors | India | Wishkarma.com",
		        "description": "Browse our catalogue of all mirrors, wall, bathroom, decorative, round mirrors available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bathroom mirrors, big mirrors, decorative mirrors, decorative wall mirrors, designer mirrors, floor mirror, full length mirror, full length wall mirror, large mirrors, large wall mirrors, long mirror, mirror, mirror wall, mirrors for sale, round mirror, standing mirror, vanity mirror, wall mirrors."
		      }
		    },
		    {
		      "id": "Product-ModularKitchen",
		      "key": 1,
		      "value": {
		        "title": "modular kitchen, modular kitchen designs| India | Wishkarma.com",
		        "description": "Browse our catalogue of all modular kitchen, modular kitchen designs available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "design of modular kitchen, indian kitchen cabinets, indian kitchen design, indian style kitchen design, kitchen modular, latest modular kitchen designs, modular kichen, modular kitchen, modular kitchen accessories, modular kitchen cabinets, modular kitchen cabinets online, modular kitchen cost, modular kitchen design ideas, modular kitchen designs, modular kitchen designs and price, modular kitchen designs for small kitchens, modular kitchen designs with price, modular kitchen fittings, modular kitchen furniture, modular kitchen ideas, modular kitchen manufacturers, modular kitchen online, modular kitchen price, modular kitchen racks, online modular kitchen, small modular kitchen."
		      }
		    },
		    {
		      "id": "Product-Napkin",
		      "key": 1,
		      "value": {
		        "title": "Napkins | Wishkarma.com",
		        "description": "Napkins",
		        "keywords": "napkins"
		      }
		    },
		    {
		      "id": "Product-NapkinHolder",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-NaturalStone",
		      "key": 1,
		      "value": {
		        "title": "natural stone, tile | India | Wishkarma.com",
		        "description": "Browse a variety of natural stones, ceramic tiles available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "granite flooring, granite slabs, granite tiles, marble, floor tile, marble tile, natural stone, natural stone floor tiles, natural stone flooring, natural stone tile, stone floor tiles, stone flooring, stone tile, stone wall tile."
		      }
		    },
		    {
		      "id": "Product-OfficeChair",
		      "key": 1,
		      "value": {
		        "title": "office chairs, office furniture | India | Wishkarma.com",
		        "description": "Browse our catalogue of office chairs, office furnitures savailable in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "best office chair, chair office, comfortable office chair, ergonomic office chair, executive office chairs, executive office furniture, home office furniture, leather office chair, office chair price, office chairs, office chairs for sale, office chairs on sale, office desk, office furniture, white office chair."
		      }
		    },
		    {
		      "id": "Product-OfficeDesk",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-OfficeWorkStation",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-OilSet",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Ottoman",
		      "key": 1,
		      "value": {
		        "title": "ottoman, ottoman furniture | India | Wishkarma.com",
		        "description": "Browse our catalogue of all ottomans, furnitures ottomans available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "chair and ottoman, fabric ottoman, leather ottoman, leather ottoman coffee table, ottoman, ottoman chair, ottoman footstool, ottoman furniture, ottoman storage, ottoman with storage, ottomans for sale, round ottoman, round storage ottoman, small ottoman, storage ottoman, tufted ottoman."
		      }
		    },
		    {
		      "id": "Product-Oven",
		      "key": 1,
		      "value": {
		        "title": "oven, convenction oven, electric oven | India | Wishkarma.com",
		        "description": "Browse our catalogue of all ovens, convenction ovens, electric ovens available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "best oven, built in ovens, convection oven, conventional oven, double oven, double wall oven, electric oven, gas oven, induction oven, kitchen oven, microwave convection oven, oven, oven price, ovens for sale, single oven, small oven, stainless steel oven, wall oven."
		      }
		    },
		    {
		      "id": "Product-OvenGlove",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-OverheadShower",
		      "key": 1,
		      "value": {
		        "title": "overhead shower, shower heads | India | Wishkarma.com",
		        "description": "Browse our catalogue of all overhead showers, shower heads, rain shower heads available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "best rain shower head, best shower head, ceiling mounted rain shower head, ceiling shower head, double shower head, grohe shower head, hand held shower heads, head shower, large shower heads, overhead shower, overhead shower head, rain head shower, rain shower head, shower heads, square rain shower head."
		      }
		    },
		    {
		      "id": "Product-Paint",
		      "key": 1,
		      "value": {
		        "title": "paint, wall paintings, texture paint | India | Wishkarma.com",
		        "description": "Browse our catalogue of all paint, wall painting, texture paints available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bathroom paint, bedroom paint colors, best exterior paint, best interior paint, best paintings, buy paint, ceiling paint, eggshell paint, emulsion paint, enamel paint, exterior house colors, exterior house paint, exterior paint, gloss paint, home painting, house paint colors, house painting, interior paint, interior, paint colors, interior paint colours, kitchen paint, metal paint, outdoor paint, paint, paint brands, paint colors, paint colors for bedrooms, mpaint colour, chart, paint cost, paint prices, paint primer, paint program, paint supplies, painting ideas, painting walls, paintings for home, texture paint, wall paint colors, wall paint colours, wall painting, wall painting ideas, white paint, wood paint.."
		      }
		    },
		    {
		      "id": "Product-Pan",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-PastaStrainer",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-PizzaCutter",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-PlaceMat",
		      "key": 1,
		      "value": {
		        "title": "place mats, table mats | India | Wishkarma.com",
		        "description": "Browse our catalogue of all palce mats, table mats, dining table placemats available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "dining table mats, dining table placemats, glass table mats, place mats, placemats, round placemats, round, table mats, table mats, table mats online, table placemats, white placemats, white table mats."
		      }
		    },
		    {
		      "id": "Product-Plate",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Plywood",
		      "key": 1,
		      "value": {
		        "title": "Plywoods | Plywood Manufacturers | India | Wishkarma.com",
		        "description": "Browse a best quality of plywoods, waterproof plywood sheets, marine plywood grades, and furniture grade plywoods available in India. Connect and chat with our suppliers for the best prices",
		        "keywords": "birch plywood, cost of plywood, hardwood plywood, laminated plywood, marine grade plywood, marine plywood, marine plywood price, plyboard, plywood, plywood cost, plywood flooring, plywood for sale, plywood grades, plywood manufacturers, plywood prices, plywood sheets, price of plywood, veneered plywood, waterproof plywood."
		      }
		    },
		    {
		      "id": "Product-Pot",
		      "key": 1,
		      "value": {
		        "title": "pot | India | Wishkarma.com",
		        "description": "Browse our catalogue of all pots in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "nyse pot, pot, pot prices, the pot."
		      }
		    },
		    {
		      "id": "Product-PotHolder",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-PressureCooker",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-PullOut",
		      "key": 1,
		      "value": {
		        "title": "pull outs| India | Wishkarma.com",
		        "description": "Browse our catalogue of all pull outs, withdrawal methods available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "kitchen cabinet drawers, kitchen cabinet pull out shelves, kitchen pull out shelves, pull out cabinet shelves, pull out drawers, pull out drawers for kitchen cabinets, pull out kitchen bin, pull out kitchen shelves, pull out shelves, pull out shelves for kitchen cabinets, roll out kitchen shelves."
		      }
		    },
		    {
		      "id": "Product-RainShower",
		      "key": 1,
		      "value": {
		        "title": "rain shower | India | Wishkarma.com",
		        "description": "Browse a wide range of all best rain showers, water fall showers, rain shower systems available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "best rain shower head, rain head shower, rain shower, rain shower head, rain shower system, shower head rainfall, shower rain, square shower head, water saving, shower heads, waterfall shower."
		      }
		    },
		    {
		      "id": "Product-Raising",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Reclining",
		      "key": 1,
		      "value": {
		        "title": "recliner | India | Wishkarma.com",
		        "description": "Browse our catalogue of all recliner sofas, leather reclining sofas, leather recliners available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "double recliner sofa, fabric recliner sofa, leather recliners, leather reclining sofa, leather sectional sofa, leather sofa recliner, power recliner sofa, power reclining sofa, recliner, reclining leather sofa, reclining sofa, reclining sofa sets, sofa recliner."
		      }
		    },
		    {
		      "id": "Product-Refrigerator",
		      "key": 1,
		      "value": {
		        "title": "refrigerator | India | Wishkarma.com",
		        "description": "Browse our catalogue of all refrigerators, fridge, fridge freezers available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "best fridge, best refrigerator brands, built in refrigerators, buy fridge, cheap fridges, chest freezer, double door fridge, double door refrigerator, freezerless refrigerator, fridge, fridge freezer, fridge online, fridge price, new fridge, new refrigerator, refrigerator, refrigerator deals, refrigerator for sale, refrigerator price, refrigerator sale, side by side, refrigerator, small fridge, small refrigerator, under counter fridge."
		      }
		    },
		    {
		      "id": "Product-RobeHook",
		      "key": 1,
		      "value": {
		        "title": "robe hooks | India | Wishkarma.com",
		        "description": "Browse our catalogue of all robe hooks, towel hooks, decorative hooks available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bathroom hooks, bathroom robe, bathroom towel holders, decorative hooks, hand towel holder, robe hooks, towel bar, towel holder, towel hooks, towel rack, towel rack for bathroom, towel rod, towel stand."
		      }
		    },
		    {
		      "id": "Product-Rug",
		      "key": 1,
		      "value": {
		        "title": "rugs | India | Wishkarma.com",
		        "description": "Browse our catalogue of all rugs, area rugs available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "area rugs, discount rugs, floor rugs, living room rugs, modern rugs, oriental rugs, outdoor rugs, persian rugs, rugs, rugs for sale, shag rugs, sheepskin rug, throw rugs."
		      }
		    },
		    {
		      "id": "Product-SOSS",
		      "key": 1,
		      "value": {
		        "title": "soss hinges | India | Wishkarma.com",
		        "description": "Browse our catalogue of all soss hinges, concealed hinges available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "concealed hinges, door hardware, heavy duty hidden, hinges, hidden door hinges, hidden hinges, invisible, door hinges, invisible hinges, soft close hinges, soss hinges."
		      }
		    },
		    {
		      "id": "Product-SaltAndPepper",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-SaucePan",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Screeds",
		      "key": 1,
		      "value": {
		        "title": "screed, self leveling screed | India | Wishkarma.com",
		        "description": "Find here stonescreeds, self leveling screeds, natural adhesives manufacturers, adhesive for granites available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "concrete floor screed, concrete power screed, fast, drying screed, floor levelling screed, floor screed, screed, screed concrete, screed floor, self leveling screed, self levelling screed, wet screed."
		      }
		    },
		    {
		      "id": "Product-SealersAndImpregnators",
		      "key": 1,
		      "value": {
		        "title": "SealersAndImpregnators | Tile Glue | Wishkarma",
		        "description": "Find here stone adhesives, tile adhesives, natural adhesives manufacturers, adhesive for granite, glue for stone, floor adhesive etc.",
		        "keywords": "ceramic tile adhesive, marble adhesive, SCHOMBURG  adhesive, strong adhesive, marble glue, granite glue, natural stone tile adhesive, stone cladding adhesive, flexible floor tile adhesive, best floor tile adhesive, best adhesive for marble tiles, block adhesive, adhesive for ceramic tile."
		      }
		    },
		    {
		      "id": "Product-Sectional",
		      "key": 1,
		      "value": {
		        "title": "sectional sofas | India | Wishkarma.com",
		        "description": "Browse our catalogue of all sectional sofas, living room furnitures available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "couch, couches for sale, leather furniture, leather sofa, living room furniture, living room sets, sectional, sectional couch, sectional sofas, small sectional sofa, sofa, sofa bed, sofa sectionals, sofa set."
		      }
		    },
		    {
		      "id": "Product-ServingBowl",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-ShoeCabinet",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-ShowCabinet",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Shower",
		      "key": 1,
		      "value": {
		        "title": "shower | India | Wishkarma.com",
		        "description": "Browse our catalogue of all showers available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bathroom showers, electric showers, shower, shower designs, shower stalls, shower units, steam shower."
		      }
		    },
		    {
		      "id": "Product-ShowerAccessory",
		      "key": 1,
		      "value": {
		        "title": "shower accessories | India | Wishkarma.com",
		        "description": "Browse our catalogue of all showers accessories in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bath caddy, bathroom shower accessories, corner shower caddy, shower accessories, shower basket, shower caddy, shower fittings, shower organizer, stainless steel shower caddy."
		      }
		    },
		    {
		      "id": "Product-ShowerArm",
		      "key": 1,
		      "value": {
		        "title": "shower arm | India | Wishkarma.com",
		        "description": "Browse our catalogue of all shower arms, shower arm extensions available in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "hand shower, rain head shower, rain shower head, shower arm, shower arm extension, shower head extension, shower heads, shower pipe."
		      }
		    },
		    {
		      "id": "Product-ShowerCabins",
		      "key": 1,
		      "value": {
		        "title": "Best shower cabins | India | Wishkarma.com",
		        "description": "Browse our catalogue of all showers cabins, shower enclosures in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "glass shower doors, glass shower enclosures, shower cabin, shower cabins, shower cubicles, shower enclosures, shower panels, shower stalls, shower trays, shower units, steam shower, walk in shower."
		      }
		    },
		    {
		      "id": "Product-ShowerCubicle",
		      "key": 1,
		      "value": {
		        "title": "Best Shower Head | Shower Wall Panels | Wishkarma",
		        "description": "Browse a wide range of best shower heads, shower trays, steam showers, glass shower panels, and overhead showers with different colors.",
		        "keywords": "overhead rain showers, handheld shower head, delta shower heads, overhead showers ,led showers, steam showers, shower screens, shower heads, luxury steam showers, slimline shower head, shower screens for baths, framed shower screens, caroma shower, screen shower, luxury showers, steam shower at home, steam bath manufacturer, low flow shower heads."
		      }
		    },
		    {
		      "id": "Product-ShowerCurtain",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-ShowerFaucet",
		      "key": 1,
		      "value": {
		        "title": "shower faucet | India | Wishkarma.com",
		        "description": "Browse our catalogue of all showers, bathroom faucets in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bathroom faucets, delta bathroom faucets, delta faucets, delta shower faucet, faucet, shower controls, shower faucet, shower knobs, shower set."
		      }
		    },
		    {
		      "id": "Product-ShowerHead",
		      "key": 1,
		      "value": {
		        "title": "shower heads | India | Wishkarma.com",
		        "description": "Browse our catalogue of all showers heads, rain shower heads in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "best shower head, hand held shower heads, head shower, high pressure shower head, low flow shower head, low pressure shower head, rain shower, rain shower head, shower heads, showerheads, water saving shower heads."
		      }
		    },
		    {
		      "id": "Product-ShowerPanel",
		      "key": 1,
		      "value": {
		        "title": "shower panels, shower wall panels | India | Wishkarma.com",
		        "description": "Browse our catalogue of all shower panels, shower wall panels in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "bath panels, bathroom shower panels, blue ocean shower panel, glass shower panels, shower panel system, shower panels, shower wall panels."
		      }
		    },
		    {
		      "id": "Product-ShowerRail",
		      "key": 1,
		      "value": {
		        "title": "shower rail | India | Wishkarma.com",
		        "description": "Browse our catalogue of all shower rails, curtain rod , curtain rails in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "corner shower curtain rod, curved shower curtain rod\nshower curtain rail, shower curtain rod, shower rail, shower rail kit, shower riser kit, shower rod."
		      }
		    },
		    {
		      "id": "Product-ShowerTrays",
		      "key": 1,
		      "value": {
		        "title": "shower trays | India | Wishkarma.com",
		        "description": "Browse our catalogue of all shower trays, shower pans in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "acrylic shower base, shower base, shower enclosures, shower pan, shower tray sizes, shower trays, stone shower trays."
		      }
		    },
		    {
		      "id": "Product-ShowerWallPanels",
		      "key": 1,
		      "value": {
		        "title": "Best Shower Head | Shower Wall Panels | Wishkarma",
		        "description": "Browse a wide range of best shower heads, shower trays, steam showers, glass shower panels, and overhead showers with different colors.",
		        "keywords": "overhead rain showers, handheld shower head, delta shower heads, overhead showers ,led showers, steam showers, shower screens, shower heads, luxury steam showers, slimline shower head, shower screens for baths, framed shower screens, caroma shower, screen shower, luxury showers, steam shower at home, steam bath manufacturer, low flow shower heads."
		      }
		    },
		    {
		      "id": "Product-ShutterHinge",
		      "key": 1,
		      "value": {
		        "title": "hinges, shutter hinges | India | Wishkarma.com",
		        "description": "Browse our catalogue of all hinges, shutter hinges in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "exterior shutter hardware, shutter hardware, shutter hinges."
		      }
		    },
		    {
		      "id": "Product-SideBoard",
		      "key": 1,
		      "value": {
		        "title": "sideboard| India | Wishkarma.com",
		        "description": "Browse our catalogue of all sideboards, sideboard designs in India. Connect and chat with our suppliers for the best prices.",
		        "keywords": "black sideboard, cheap sideboards, china cabinet, designer sideboard, modern sideboard, queen headboard, sideboard, sideboard design, sideboard online, sideboards and buffets."
		      }
		    },
		    {
		      "id": "Product-SingleBed",
		      "key": 1,
		      "value": {
		        "title": "Single Bed Frame | India | Wishkarma.com ",
		        "description": "Browse our collection of Single Bed Frames available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "Single bed, single bed frame, cheap single beds, single bed price, single bed with storage, small single bed, wooden single beds."
		      }
		    },
		    {
		      "id": "Product-Sinks",
		      "key": 1,
		      "value": {
		        "title": "Sink | India | Wishkarma.com",
		        "description": "Browse our collection of Sink available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "bathroom sink, bowl sink, corner sink, granite sinks, kitchen sink, pedestal sink, sink, sink kitchen, stainless steel sinks, undermount sink."
		      }
		    },
		    {
		      "id": "Product-SoapDish",
		      "key": 1,
		      "value": {
		        "title": "soap dish | India | Wishkarma.com ",
		        "description": "Browse our collection of Soap Dish available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "ceramic soap dish, shower soap dish, soap case, soap dish, soap holder."
		      }
		    },
		    {
		      "id": "Product-Sofa",
		      "key": 1,
		      "value": {
		        "title": "Sofa | India | Wishkarma.com ",
		        "description": "Browse our collection of Sofa available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "corner sofa, fabric sofas, leather sofa, reclining sofa, sectional sofas, sleeper sofa, sofa bed."
		      }
		    },
		    {
		      "id": "Product-SolarLight",
		      "key": 1,
		      "value": {
		        "title": "solar Lights | India | Wishkarma.com ",
		        "description": "Browse our collection of Solar Lights, solar garden lights, solar led lights available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "hanging solar lights, led solar lights, outdoor solar lights, solar garden lights, solar led lights, solar lights, solar security lights, solar spot lights."
		      }
		    },
		    {
		      "id": "Product-Spout",
		      "key": 1,
		      "value": {
		        "title": "spout | India | Wishkarma.com ",
		        "description": "Browse our collection of spout available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "bathtub spout, shower spout, spout, tub spout."
		      }
		    },
		    {
		      "id": "Product-Steamer",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-StewPan",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-StoneAdhesive",
		      "key": 1,
		      "value": {
		        "title": "stone adhesive | India | Wishkarma.com ",
		        "description": "Browse our collection of Stone Adhesive available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "adhesive for stone, granite adhesive, marble adhesive, stone adhesive."
		      }
		    },
		    {
		      "id": "Product-StoneSealer",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-StorageBed",
		      "key": 1,
		      "value": {
		        "title": " storage bed | India | Wishkarma.com",
		        "description": "Browse our collection of StorageBed available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "bed with storage, double bed with storage, double storage bed, single storage beds, storage bed, white storage bed. "
		      }
		    },
		    {
		      "id": "Product-StorageUnit",
		      "key": 1,
		      "value": {
		        "title": "storage unit | India | Wishkarma.com",
		        "description": "Browse our collection of storage unit available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "small storage units, storage, storage space, storage units, storage units prices."
		      }
		    },
		    {
		      "id": "Product-StorageWall",
		      "key": 1,
		      "value": {
		        "title": "storage wall | India | Wishkarma.com",
		        "description": "Browse our collection of storage wall available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "storage wall, storage wall shelves, wall mounted storage, wall mounted storage units, wall storage shelves, wall storage systems"
		      }
		    },
		    {
		      "id": "Product-Strainer",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-SugarBowl",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-SupportRail",
		      "key": 1,
		      "value": {
		        "title": "support rail | India | Wishkarma.com ",
		        "description": "Browse our collection of support rail available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "grab handles, hand rail, support rail"
		      }
		    },
		    {
		      "id": "Product-Switch",
		      "key": 1,
		      "value": {
		        "title": "sockets and switches | India | Wishkarma.com ",
		        "description": "Browse our collection of sockets and switches available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "electric socket, electrical switches and sockets, power socket, socket switch, sockets and switches, switches and sockets."
		      }
		    },
		    {
		      "id": "Product-Table",
		      "key": 1,
		      "value": {
		        "title": "tables | India | Wishkarma.com ",
		        "description": "Browse our collection of tables available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "coffee table, dining room tables, dining table, glass dining table, kitchen table, round dining room tables, round dining table, side table, small dining tables, table, wood dining table."
		      }
		    },
		    {
		      "id": "Product-TableCloth",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-TableDecoration",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-TableLamp",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-TableRunner",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-TeaInfuser",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-TeaSet",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Test",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Tile",
		      "key": 1,
		      "value": {
		        "title": "Tile | Wall and Floor Tiles | Wishkarma",
		        "description": "Browse a good quality of wall and floor tiles including kitchen tiles, bathroom tiles, ceramics tiles, rustic tiles, kitchen floor tiles available in different designs.",
		        "keywords": "Designer tiles, modern floor tiles, white wall tiles, hand painted tiles, ceramic mosaic tiles, contemporary tiles, digital tiles, roof tiles, rustic slate floor tiles, polished tiles, wood tiles, ceramic wood tile, tropical tiles, farmhouse floor tiles."
		      }
		    },
		    {
		      "id": "Product-TileAccessories",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Timer",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-TissueDispenser",
		      "key": 1,
		      "value": {
		        "title": "Bathroom Sink Faucets | Faucet Manufactures | India",
		        "description": "Search a wide variety of bathroom sink faucets, tub faucets, washbasin faucet in wishkarma and sinks available in top brands like Grohe, Jaquar.",
		        "keywords": "shower faucets, wall mount tub faucet, lavatory faucets, bidet mixer, bath mixer, modern bathroom faucets, tub and shower faucets, bidet faucets, chrome faucets, brushed nickel faucets, bath sink faucets, crystal faucets, wall mount lavatory faucets, bath and shower faucet, Jaquar faucets, bathroom taps Jaquar,  kitchen faucets Jaquar, kitchen faucets, luxury bathroom faucets,valves."
		      }
		    },
		    {
		      "id": "Product-ToiletBrush",
		      "key": 1,
		      "value": {
		        "title": "toilet Brush | India | Wishkarma.com ",
		        "description": "Browse our collection of toilet Brush available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "bath brush, best toilet brush, modern toilet brush, toilet brush, toilet brush set, toilet cleaner brush, wall mounted toilet brush."
		      }
		    },
		    {
		      "id": "Product-ToiletBrushHolder",
		      "key": 1,
		      "value": {
		        "title": "toilet brush holder | India | Wishkarma.com ",
		        "description": "Browse our collection of toilet brush holder available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "ceramic toilet brush holder, stainless steel toilet brush, toilet brush, toilet brush and holder set, toilet brush holder, toilet brush with holder, toilet cleaning brush, wall mounted toilet brush holder."
		      }
		    },
		    {
		      "id": "Product-ToiletRollHolder",
		      "key": 1,
		      "value": {
		        "title": "toilet roll holder | India | Wishkarma.com",
		        "description": "Browse our collection of toilet roll holder available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "bathroom toilet roll holder, chrome toilet roll holder, loo roll holder, stainless steel toilet roll holder, toilet paper holder, toilet roll holder"
		      }
		    },
		    {
		      "id": "Product-ToiletSeat",
		      "key": 1,
		      "value": {
		        "title": "toilet seat | India | Wishkarma.com",
		        "description": "Browse our collection of toilet seat available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "best toilet seat, family toilet seat, soft close toilet seat, toilet seat, toilet seat covers, toilet seat price"
		      }
		    },
		    {
		      "id": "Product-Toilets",
		      "key": 1,
		      "value": {
		        "title": "toilets | India | Wishkarma.com",
		        "description": "Browse our collection of toilets   available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "american standard toilets, bathroom toilet, toilet, toilets for sale, toto toilets, wall hung toilet, wall mounted toilet."
		      }
		    },
		    {
		      "id": "Product-ToiletsIndian",
		      "key": 1,
		      "value": {
		        "title": "toilets indian | India | Wishkarma.com",
		        "description": "Browse our collection of toilets indian available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "indian commode, indian commode price, indian style toilet, indian toilet, indian toilet price, western toilet seat for indian toilet."
		      }
		    },
		    {
		      "id": "Product-ToothBrushHolder",
		      "key": 1,
		      "value": {
		        "title": "tooth brush holder | India | Wishkarma.com",
		        "description": "Browse our collection of tooth brush holder  available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "kids toothbrush holder, toothbrush holder, toothbrush holder wall mount, toothbrush stand, toothpaste and toothbrush holder, toothpaste holder, wall mounted toothbrush holder."
		      }
		    },
		    {
		      "id": "Product-ToothbrushHolder",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-TowelHolder",
		      "key": 1,
		      "value": {
		        "title": "towel holder | India | Wishkarma.com",
		        "description": "Browse our collection of towel holder available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "hand towel holder, towel bar, towel hanger, towel holder, towel hooks, towel rack, towel ring, towel stand."
		      }
		    },
		    {
		      "id": "Product-Tray",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Tub",
		      "key": 1,
		      "value": {
		        "title": "tub | India | Wishkarma.com",
		        "description": "Browse our collection of tub available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "bathroom tubs, bathtub, bathtub price, big bathtubs, new bathtub, shower tub, small bathtub, tub, whirlpool tub."
		      }
		    },
		    {
		      "id": "Product-TumbleDryers",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-TumblerHolder",
		      "key": 1,
		      "value": {
		        "title": "tumbler holder | India | Wishkarma.com",
		        "description": "Browse our collection of tumbler holder available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "bathroom tumbler, toothbrush tumbler, tumbler holder, tumbler holder bathroom."
		      }
		    },
		    {
		      "id": "Product-TvCabinet",
		      "key": 1,
		      "value": {
		        "title": "tv Cabinet | India | Wishkarma.com",
		        "description": "Browse our collection of tv Cabinet available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "corner tv cabinet, corner tv unit, modern tv stands, tv cabinet, tv cabinet with doors, tv wall unit, wooden tv cabinets, wooden tv stands"
		      }
		    },
		    {
		      "id": "Product-Urinal",
		      "key": 1,
		      "value": {
		        "title": "urinal | India | Wishkarma.com",
		        "description": "Browse our collection of urinal available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "bathroom urinal, commercial toilets and urinals, commercial urinals, toilet urinal, urinal, urinal sensor, urinals for home, waterfree urinal, waterless urinal."
		      }
		    },
		    {
		      "id": "Product-UtilitySink",
		      "key": 1,
		      "value": {
		        "title": "utility sink | India | Wishkarma.com",
		        "description": "Browse our collection of utility sink available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "laundry room sink, laundry sink, laundry sink cabinet, laundry tub, stainless steel utility sink, utility sink cabinet, utility sink with cabinet, utility tub, wall mount utility sink."
		      }
		    },
		    {
		      "id": "Product-VanityUnit",
		      "key": 1,
		      "value": {
		        "title": "vanity unit | India | Wishkarma.com",
		        "description": "Browse our collection of vanity unit available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "bathroom vanities, corner vanity unit, double vanity unit, sink vanity unit, vanity units, wall hung vanity, wall hung vanity unit, wall mounted bathroom vanity, wooden vanity units."
		      }
		    },
		    {
		      "id": "Product-Veneer",
		      "key": 1,
		      "value": {
		        "title": "veneers | India | Wishkarma.com",
		        "description": "Browse our collection of veneers available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "veneer wood, wood veneer, teak veneer, veneers wood, veneer furniture, wooden veneer, white veneer, black veneer, stone veneer siding, exterior stone veneer, buy wood veneer, walnut wood veneer."
		      }
		    },
		    {
		      "id": "Product-WC",
		      "key": 1,
		      "value": {
		        "title": "wc | India | Wishkarma.com",
		        "description": "Browse our collection of wc available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "duravit wc, wc, wc compact, wc design, wc set, wc toilet."
		      }
		    },
		    {
		      "id": "Product-WalkInWardrobe",
		      "key": 1,
		      "value": {
		        "title": "walk in wardrobe | India | Wishkarma.com",
		        "description": "Browse our collection of walk in wardrobe available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "built in wardrobes, sliding wardrobes, walk in closet, walk in wardrobe, wardrobe design, wardrobe storage, wardrobe storage systems, wardrobes with sliding doors."
		      }
		    },
		    {
		      "id": "Product-WallCabinet",
		      "key": 1,
		      "value": {
		        "title": "wall cabinet | India | Wishkarma.com",
		        "description": "Browse our collection of wall cabinet available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "bathroom sink cabinets, bathroom wall cabinets, corner cabinet, corner wall cabinet, glass wall cabinet, hanging wall cabinets, kitchen wall cabinets, wall cabinets, wall mounted bathroom cabinets, wall mounted cabinets, wall storage cabinets."
		      }
		    },
		    {
		      "id": "Product-WallTile",
		      "key": 1,
		      "value": {
		        "title": "wall tile | India | Wishkarma.com",
		        "description": "Browse our collection of wall tile available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "bathroom wall tiles, ceramic tile, kitchen tiles, kitchen wall tiles, tile shop, wall and floor tiles, wall tiles"
		      }
		    },
		    {
		      "id": "Product-Wallpaper",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Wardrobes",
		      "key": 1,
		      "value": {
		        "title": "Wardrobes | India | Wishkarma.com",
		        "description": "Browse our collection of Wardrobes available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "3 door wardrobe, bedroom wardrobes, double wardrobe, freestanding wardrobe, large wardrobes, mirrored wardrobe, single wardrobe, tall wardrobes, wardrobe, wardrobe closet, wardrobe design, wardrobe storage"
		      }
		    },
		    {
		      "id": "Product-Washbasin",
		      "key": 1,
		      "value": {
		        "title": "wash basin | India | Wishkarma.com",
		        "description": "Browse our collection of wash basin available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "bathroom wash basin, bathroom wash basin designs, corner wash basin, small wash basin, table top wash basin designs, wall hung basin, wall mounted wash basin, wash basin, wash basin designs, wash basin mirror, wash basin sink, wash basin stand, washbasins."
		      }
		    },
		    {
		      "id": "Product-WashbasinCounterTop",
		      "key": 1,
		      "value": {
		        "title": "washbasin counter top | India | Wishkarma.com",
		        "description": "Browse our collection of washbasin counter top  available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "counter top basin, counter top sink, counter top wash basin, countertop basin, wash basin counter, wash basin counter top."
		      }
		    },
		    {
		      "id": "Product-WashbasinFaucet",
		      "key": 1,
		      "value": {
		        "title": "wash basin faucet | India | Wishkarma.com",
		        "description": "Browse our collection of wash basin faucet available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "bathroom faucets, bathroom sink faucets, best bathroom faucets, delta kitchen faucets, kitchen faucets, kitchen sink faucets, lavatory faucet, modern bathroom faucets, shower faucet, tub faucet, utility sink faucet, wash basin faucet."
		      }
		    },
		    {
		      "id": "Product-Washbasincountertop",
		      "key": 1,
		      "value": {
		        "title": "washbasin counter top | India | Wishkarma.com",
		        "description": "Browse our collection of washbasin counter top  available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "counter top basin, counter top sink, counter top wash basin, countertop basin, wash basin counter, wash basin counter top."
		      }
		    },
		    {
		      "id": "Product-WashingMachine",
		      "key": 1,
		      "value": {
		        "title": "washing machine | India | Wishkarma.com",
		        "description": "Browse our collection of washing machine available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "best washing machine, cheap washing machines, front load washing machine, fully automatic washing machine, laundry machine, lg washing machine, top load washing machine, washer and dryer, washer dryer, washing machine, washing machine price"
		      }
		    },
		    {
		      "id": "Product-WasteBin",
		      "key": 1,
		      "value": {
		        "title": "waste bin | India | Wishkarma.com",
		        "description": "Browse our collection of waste bin available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "bathroom trash can, garbage can, indoor trash cans, kitchen garbage bins, kitchen trash can, large kitchen trash can, recycle trash cans, trash can, trash can with lid, waste bin."
		      }
		    },
		    {
		      "id": "Product-WaterProofing",
		      "key": 1,
		      "value": {
		        "title": "waterproofing | India | Wishkarma.com",
		        "description": "Browse our collection of waterproofing  available in India. Connect and chat with our suppliers for best prices.",
		        "keywords": "basement waterproofing, concrete waterproofing, exterior waterproofing, foundation waterproofing, liquid waterproofing, roof waterproofing, waterproof cement, waterproofing, waterproofing basement, waterproofing contractors, waterproofing solutions."
		      }
		    },
		    {
		      "id": "Product-WaterPurifier",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-WineCooler",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    },
		    {
		      "id": "Product-Wire",
		      "key": 1,
		      "value": {
		        "title": "Wire and Cable | Single Core Wire Suppliers | Wishkarma",
		        "description": "Wires and cables for new houses are available in our website. Our inventory includes electric cables, power cables, cable wires, industrial cable in different diameters and colors.",
		        "keywords": "electrical wires, cables and wires, cable manufacturers, wire manufacturers, wire and cable manufacturers, cable manufacturing, power cable manufacturers, cable suppliers, industrial electric wire and cable, finolex cables , finolex wires,  oreva group cables,  wires oreva group."
		      }
		    },
		    {
		      "id": "Product-WoodCoating",
		      "key": 1,
		      "value": {
		        "title": "Wood Coatings | Water Based Coatings | Wishkarma",
		        "description": "Browse a wide variety of wood coatings, water based coatings , wood coating finishes ,wood paint finishes etc.",
		        "keywords": "wood stain, wood finishes, wood paint, wood stain colors, wood sealer, wood varnish, wood coating, staining wood, wood finishing products, wood floor finishes, blue wood stain, wood deck coating, colored wood stain, plastic coating for wood, finished wood."
		      }
		    },
		    {
		      "id": "Product-WritingDesk",
		      "key": 1,
		      "value": {
		        "title": "",
		        "description": "",
		        "keywords": ""
		      }
		    }
		  ]
		}
	    
update(0);
function update(index){
	var recordId=things.rows[index].id;
	cbMasterBucket.get(recordId,function(recErr, recRes) {
		if(!recErr){
			var docu=recRes.value;
			//console.log(docu.htmlMeta);
			docu.htmlMeta=things.rows[index].value;
			if(docu.htmlMeta.title.trim()==""){
				docu.htmlMeta.title=docu.displayName+" | India | Wishkarma.com"
			}
			if(docu.htmlMeta.description.trim()==""){
				docu.htmlMeta.description="Browse our collection of "+docu.displayName+" available in India. Connect and chat with our suppliers for best prices.";
			}
			//console.log(docu.htmlMeta);
			console.log("Updating ........."+ (index*1+1) +"          "+recordId+"             ");	
			cbMasterBucket.upsert(recordId,docu,function(err, result) {
				if (err) { console.log(err); }
				if((index+1)<things.rows.length){
					update(index+1);
				}
			});
		}else{
			if((index+1)<things.rows.length){
				update(index+1);
			}
		}
	});
}

