const {parseItem} = require('./parse-item');
const {printItems} = require('./print-items');

var itemLimit = 50;

function mergeOrder(items) {
    let result = [];
    // This function merges identical json object in an order list
    for (let item of items) {
      let orderItem = parseItem(item);
      let hasPushed = false;
      for (let i = 0; i < result.length; i++) {
        let resultItem = result[i];
        if (orderItem.name != resultItem.name) continue;
        if (arraysEqual(orderItem.options, resultItem.options)) {
          // same item, increase amount
          result[i].amount += orderItem.amount;
          hasPushed = true;
        }
        console.log(orderItem.name + " " + resultItem.name + " " + hasPushed);
      }
      if (!hasPushed) {
        result.push(orderItem);
      }
    }
    //detect fraudulent deals
    for (let i = 0; i < result.length; i++) {
      if(result[i].amount - itemLimit > 0){
    	  result[i].amount = itemLimit;
         //agent.add("[Robo-waiter] Thank you, but we only accept order amount of " + itemLimit + " at most."); //need to confirm with Kyle
      }
    }
    return result;
  }

function arraysEqual (a1, a2){
	if(a1.length != a2.length) return false;
	  
	let set = new Set(a1);
	for (let e of a2){
		if(set.has(e) == false){
			return false;
		}
	}
	return true;
  }

order = ["1 hamburger combo", "1 chocolate shake", "1 hamburger combo", "2 chocolate shakes", "5 orders of fries"];
order = mergeOrder(order);
console.log(printItems(order));
