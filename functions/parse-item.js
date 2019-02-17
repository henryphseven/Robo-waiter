const itemOptions = require('./item-options');
const itemMap = itemOptions.itemMap;
const burgerIngredients = itemOptions.burgerIngredients;
const optionMap = itemOptions.optionMap;
const { wordsToNumbers } = require('words-to-numbers'); //a module to transform words to numbers
//need to install the module first: npm install words-to-numbers
function matchSet(str, set) {

	let match = [];

	for (let element of set) {
		//Both indexOf(), and lastIndexOf() return -1 if the text is not found.
		if (str.indexOf(element) == -1) continue;
		//console.log(element);
		match.push(element);
	}

	return match;
}

function matchOptions(str, category){
	
	let optionSet = optionMap.get(category);
	
	let match = [];
	if(category == "other") return match;

	for (let element of optionSet) {
		//Both indexOf(), and lastIndexOf() return -1 if the text is not found.
		if (str.indexOf(element) == -1) continue;
		//console.log(element);
		match.push(element);
		if(category == "combo" || category == "shake" || category == "drink") break;
	}

	return match;
}

//function parseItem(str) {
exports.parseItem = function (str) {

	str = str.replace(/[?]/g, ''); //remove "?" from the string
	str = wordsToNumbers(str); //transform words to numbers, e.g., two -> 2
	//console.log(str);

	let obj = new Object();
	let items = matchSet(str, itemMap.keys()); //return matched items, maybe more than 1
	obj.name = items[0];
	obj.category = itemMap.get(obj.name);
	obj.options = matchOptions(str, obj.category); //return matched options, maybe null
	if (obj.category == "burger") {

		let ingredients = matchSet(str, burgerIngredients);
		if (ingredients.length > 0) {

			obj.options.push("with");
			obj.options = obj.options.concat(ingredients);
		}
	}
	//parseInt: Only the first number in the string is returned!
	if (str.indexOf("7-up") == 0) obj.amount = 1;
	else if (isNaN(parseInt(str, 10))) obj.amount = 1;
	else obj.amount = parseInt(str, 10);

	return obj;
};