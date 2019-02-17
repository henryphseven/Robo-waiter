const {parseItem} = require('./parse-item');
const {printItems} = require('./print-items');
const {orderPrice} = require('./order-price');
const {wordsToNumbers} = require('words-to-numbers');

let items = ["2 cut in half hamburger with more veggie and no onion", "3 animal fries", "1 coke", "3X3", "5 4X4", "one 7-up"]
let itemObjects = []; //itemObjects are an array of item objects

for(let item of items){
	
	//console.log(item);
	let result = parseItem(item); //result is a js object
	console.log(result);
	itemObjects.push(result); 
}

console.log(printItems(itemObjects));
console.log(orderPrice(itemObjects));

var num = 5.56789;
var n = num.toFixed(2);
console.log(n);

let x = { name: 'hamburger',
	  category: 'burger',
	  options: [ 'with', 'more cheese' ],
	  amount: '' };

if(x.amount == '') console.log("it's null!");

let amount = parseInt(wordsToNumbers("2 of the"), 10);
console.log(amount);



