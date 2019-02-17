function printOption(option){
	
	const countableIngredients = new Set(["more onion", "more veggie", "more pickle"]);

	if(countableIngredients.has(option)) return option + "s";
	return option;
}

function printOptions(options, start, end){
	  
	  let length = end - start;
	  let result = '';
	  
	  if (length == 1) {
	      result += printOption(options[start]);
	  } else if (length == 2) {
	      result += printOption(options[start]) + ' and ' + printOption(options[end - 1]);
	  } else { // more than 3 items
	      for (let i = start; i < end - 1; i++) {
	        result += printOption(options[i]) + ', '
	      }
	      result += 'and ' + printOption(options[end - 1]);
	  }

	  return result;  
}

function printItemObject(itemObject){
	
	  let result = itemObject.amount;
	  if(itemObject.name == "fries"){
		  
		  if(itemObject.amount > 1) result = result + " orders of";
		  else result = result + " order of";
	  }
	  //no options at all
	  if(itemObject.options == null || itemObject.options.length == 0){
		  
		  result = result + " " + itemObject.name; 
		  if(itemObject.amount > 1 && itemObject.name != "fries") result = result + "s";
		  return result;
	  } 
	  let length = itemObject.options.length;
	  let i;
	  for(i = 0; i < length; i++){
		  
		  if(itemObject.options[i] == "with") break;
		  if(i != 0) result = result + ",";
		  result = result + " " + itemObject.options[i];
	  }
	  result = result + " " + itemObject.name;
	  if(itemObject.amount > 1 && itemObject.name != "fries") result = result + "s";
	  if(i == length) return result;
	  //add ingredients, start with "with"
	  result = result + " with " + printOptions(itemObject.options, i + 1, length);
	  return result;
}

exports.printItems = function(itemObjects){
	  
	  let length = itemObjects.length;
	  let result = '';
	  
	  if (length == 1) {
	      result += printItemObject(itemObjects[0]);
	  } else if (length == 2) {
	      result += printItemObject(itemObjects[0]) + ' and ' + printItemObject(itemObjects[1]);
	  } else { // more than 3 items
	      for (let i = 0; i < length - 1; i++) {
	        result += printItemObject(itemObjects[i]) + ', '
	      }
	      result += 'and ' + printItemObject(itemObjects[length - 1]);
	  }

	  return result;  
}