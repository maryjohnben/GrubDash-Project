const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
//lists all the dishes
function list(req, res, next) {
  res.json({ data: dishes });
}
//makes sure that body has all the defined data
function bodyDataHas(property) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[property]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${property}` });
  };
}
//makes sure price is integer and above 0
function priceValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
  next();
}
//creates dish
function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}
//when ids are passed in pulls the dish and acts as a middleware and this is where res.locals is set
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: ` Dish does not exist: ${dishId}`,
  });
}
//reads each dish that is pulled using id
function read(req, res, next) {
  res.json({ data: res.locals.dish });
}
//makes sure whatever passed in the body as id is same as that is passed in the router
function bodyRouteIdValidation(req, res, next) {
  const dishId = res.locals.dish.id;
  const { data: { id } = {} } = req.body;
  if (id) {
    return dishId !== id
      ? next({
          status: 400,
          message: `Order id does not match route id. Order: ${id}, Route: ${dishId}`,
        })
      : next();
  }
  next();
}
//carries out the update
function update(req, res, next) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  res.json({ data: dish });
}

module.exports = {
  list,
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceValid,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    bodyRouteIdValidation,
    priceValid,
    update,
  ],
};
