const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res, next) {
  res.json({ data: orders });
}
//used in read update and delete
function propertyExists(property) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[property]) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include ${property}`,
    });
  };
}
//used in create and update to make sure dish is an array with something inside
function dishArrayValidation(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!Array.isArray(dishes) || !dishes.length) {
    return next({
      status: 400,
      message: "Order must include atleast one dish",
    });
  }
  next();
}
//used in update and create to make sure quantity is valid number greater than 0 and that quantity exists
function dishQuantityValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach((dish = {}) => {
    const dishQuantity = dish.quantity;
    const index = dishes.indexOf(dish);
    // console.log(index, dishQuantity)
    if (!dishQuantity || !Number.isInteger(dishQuantity) || dishQuantity <= 0) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}
//creates carries out the main creation of new order
function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

//checks if passed in params matches to a correct identification
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `No matching id found: ${orderId}`,
  });
}
//allows the get method to pull individual orders
function read(req, res, next) {
  res.json({ data: res.locals.order });
}
//makes sure status is valid and is used in update
function statusValidation(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (!status || !validStatus.includes(status)) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  next();
}
//when updating makes sure whatever passed in through router is same as what is present in the request body
//only checks if id is passed in otherwise ignores and the process continues
function bodyRouteIdValidation(req, res, next) {
  const orderId = res.locals.order.id;
  const { data: { id } = {} } = req.body;
  if (id) {
    return orderId !== id
      ? next({
          status: 400,
          message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
        })
      : next();
  }
  next();
}
//used in update
function deliveryStatusValidation(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status === "delivered") {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  next();
}
//carries out the main update using PUT
function update(req, res, next) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;
  res.json({ data: order });
}
//makes sure the status is pending before carrying out deletion
function deleteValidation(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  }
  next();
}
//completes deletion
function destroy(req, res, next) {
  const orderId = res.locals.order.id;
  const index = orders.findIndex((order) => order.id === orderId);
  const deleted = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    propertyExists("deliverTo"),
    propertyExists("mobileNumber"),
    propertyExists("dishes"),
    dishArrayValidation,
    dishQuantityValid,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    propertyExists("deliverTo"),
    propertyExists("mobileNumber"),
    propertyExists("dishes"),
    bodyRouteIdValidation,
    dishArrayValidation,
    dishQuantityValid,
    deliveryStatusValidation,
    statusValidation,
    update,
  ],
  delete: [orderExists, deleteValidation, destroy],
};
