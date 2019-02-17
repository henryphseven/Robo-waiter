const itemPrice = new Map([["hamburger", 2.40], ["cheeseburger", 2.70], ["MCS", 3.85], ["fries", 1.85], ["shake", 2.45], ["cocoa", 1.60], ["milk", 0.99], ["coffee", 1.25]]);
const friesOptPrice = new Map([["anteater style", 1.80], ["cheese", 1.50] ,["well done", 0], ["light well", 0]]);
const drinkOptPrice = new Map([["small", 1.50], ["medium", 1.60] ,["large", 1.80], ["extra large", 2.00]]);

function findPrice(itemObject){
	
	let price = 0;
	
	switch (itemObject.category) {
    	case "combo":
    		price = itemPrice.get(itemObject.options[0]) + itemPrice.get("fries") + drinkOptPrice.get("medium");
    		break;
    	case "fries":
    		price = itemPrice.get("fries");
    		if(itemObject.options.length == 0) break;
    		for(let option of itemObject.options){	
    			price = price + friesOptPrice.get(option);
    		}
    		break;
    	case "drink":
    		price = drinkOptPrice.get(itemObject.options[0]);
    		break;
    	default:
    		price = itemPrice.get(itemObject.name);
	}
	
	return price*itemObject.amount;
}

exports.orderPrice = function(itemObjects) {
	
	let price = 0;
	
	for(let itemObject of itemObjects){
		
		price = price + findPrice(itemObject);
	}
	
	//add CA TAX 0.0775
	price = price*(1 + 0.0775);
	
	return price.toFixed(2);
}