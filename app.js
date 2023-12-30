const express = require("express");
const mysql = require('mysql2');
const connection = require("./databse/db");
//const router = express.Router();
const routes = require('./routes/routes');
const router = require("./routes/routes");
const { encryptCreditCard, decryptCreditCard } = require('./encryption');

// Create a connection

const app = express();
app.use(express.json());



// Import routes
//app.use('/api/parties', routes);
//app.use(router);

// Sample data (can be replaced with database interactions)
let persons = [];

// Create a new Person
app.post('/persons', (req, res) => {
  const { firstName, lastName, email } = req.body; // Assuming these are the fields for a Person

  // Validation: Check required fields
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Please provide firstName, lastName, and email' });
  }

  // Create a new Person object
  const newPerson = { firstName, lastName, email };
  persons.push(newPerson); // Add the new Person to the data store

  // Return success message with the created Person's details
  res.status(201).json({ message: 'Person created successfully', person: newPerson });
});
// Create Order endpoint
app.post('/orders', (req, res) => {
  const {
    orderName,
    currencyUomId = 'USD', // Default to USD if not provided
    salesChannelEnumId,
    statusId = 'OrderPlaced', // Default to OrderPlaced if not provided
    productStoreId,
    placedDate,
    approvedDate
  } = req.body;

  // Validation: Check required parameters
  if (!orderName || !placedDate) {
    return res.status(400).json({ error: 'orderName and placedDate are required' });
  }

  // Here you would handle creating the Order in your database or data store
  // This is a placeholder for the successful response
  const orderId = generateOrderId(); // Function to generate unique order ID
  const newOrder = {
    orderId,
    orderName,
    currencyUomId,
    salesChannelEnumId,
    statusId,
    productStoreId,
    placedDate,
    approvedDate
  };

  // Return success message with the order identification
  res.status(201).json({ message: 'Order created successfully', orderId });
});
function generateOrderId() {
  const timestamp = Date.now().toString(36); // Convert current timestamp to base36
  const randomNum = Math.random().toString(36).substr(2, 5); // Get a random string
  return `${timestamp}${randomNum}`.toUpperCase(); // Concatenate and convert to uppercase
}

// Assuming the same Express app object is used for Order Items API

// Add Order Items endpoint
app.post('/order/items', (req, res) => {
  const {
    orderId,
    partName,
    facilityId,
    shipmentMethodEnumId = 'ShMthGround', // Default to ShMthGround if not provided
    customerPartyId,
    item_details
  } = req.body;

  // Validation: Check mandatory fields
  if (!orderId || !partName || !facilityId || !customerPartyId || !item_details || item_details.length === 0) {
    return res.status(400).json({ error: 'Required parameters are missing or invalid' });
  }

  // Validation: Check mandatory parameters for each item
  for (const item of item_details) {
    const { productId, quantity, unitAmount } = item;
    if (!productId || !quantity || !unitAmount) {
      return res.status(400).json({ error: 'Each item should have productId, quantity, and unitAmount' });
    }
  }

  // Here you would handle adding order items to an existing order in your database or data store
  // This is a placeholder for the successful response
  const orderPartSeqId = generateOrderPartSeqId(); // Function to generate unique orderPartSeqId
  // Simulating a successful response with orderId and orderPartSeqId
  res.status(201).json({ message: 'Order items added successfully', orderId, orderPartSeqId });
});
const PORT = 3000;

//app.use(bodyParser.json());

// Your routes will go here

// routes from here 

// Sample data (can be replaced with database interactions)
let orders = []; // Assume this contains the list of orders

// Get all Orders endpoint
app.get('/orders', (req, res) => {
  // Here orders is a sample array of orders for demonstration
  const sampleResponse = {
    orders: orders.map(order => ({
      orderId: order.orderId,
      orderName: order.orderName,
      currencyUom: order.currencyUom,
      salesChannelEnumId: order.salesChannelEnumId,
      statusId: order.statusId,
      placedDate: order.placedDate,
      grandTotal: order.grandTotal,
      customer_details: {
        customerPartyId: order.customerPartyId,
        firstName: order.customerFirstName,
        middleName: order.customerMiddleName,
        lastName: order.customerLastName
      },
      order_parts: order.orderParts.map(part => ({
        orderPartSeqId: part.orderPartSeqId,
        partName: part.partName,
        facilityId: part.facilityId,
        shipmentMethodEnumId: part.shipmentMethodEnumId,
        partStatusId: part.partStatusId,
        partTotal: part.partTotal,
        item_details: part.itemDetails.map(item => ({
          orderItemSeqId: item.orderItemSeqId,
          productId: item.productId,
          itemDescription: item.itemDescription,
          quantity: item.quantity,
          unitAmount: item.unitAmount
        }))
      }))
    }))
  };

  // Return the list of all orders with the defined response schema
  res.status(200).json(sampleResponse);
});

// Assuming the same Express app object is used for Get Order API

// Get an Order by ID endpoint
app.get('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;

  // Fetch the order with the specified orderId from the database or data store
  // Replace this with your actual database query to retrieve the order by ID
  // Example: const order = fetchOrderByIdFromDatabase(orderId);

  // Here order is a sample object representing an order for demonstration
  const order = orders.find(o => o.orderId === orderId); // Simulating finding the order in the sample orders array

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Construct the response in the same format as the Get Orders API (as per point 4)
  const response = {
    orders: [{
      orderId: order.orderId,
      orderName: order.orderName,
      currencyUom: order.currencyUom,
      salesChannelEnumId: order.salesChannelEnumId,
      statusId: order.statusId,
      placedDate: order.placedDate,
      grandTotal: order.grandTotal,
      customer_details: {
        customerPartyId: order.customerPartyId,
        firstName: order.customerFirstName,
        middleName: order.customerMiddleName,
        lastName: order.customerLastName
      },
      order_parts: order.orderParts.map(part => ({
        orderPartSeqId: part.orderPartSeqId,
        partName: part.partName,
        facilityId: part.facilityId,
        shipmentMethodEnumId: part.shipmentMethodEnumId,
        partStatusId: part.partStatusId,
        partTotal: part.partTotal,
        item_details: part.itemDetails.map(item => ({
          orderItemSeqId: item.orderItemSeqId,
          productId: item.productId,
          itemDescription: item.itemDescription,
          quantity: item.quantity,
          unitAmount: item.unitAmount
        }))
      }))
    }]
  };

  // Return the order information in the defined response schema
  res.status(200).json(response);
});

// Assuming the same Express app object is used for Update Order API

// Update Order Name endpoint
app.put('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const { orderName } = req.body;

  // Fetch the order with the specified orderId from the database or data store
  // Replace this with your actual database query to retrieve the order by ID
  // Example: const order = fetchOrderByIdFromDatabase(orderId);

  // Here order is a sample object representing an order for demonstration
  const order = orders.find(o => o.orderId === orderId); // Simulating finding the order in the sample orders array

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Update the order name
  order.orderName = orderName;

  // Simulating the response in the specified format
  const response = {
    orderId: order.orderId,
    orderName: order.orderName,
    currencyUomId: order.currencyUomId,
    salesChannelEnumId: order.salesChannelEnumId,
    statusId: order.statusId,
    productStoreId: order.productStoreId,
    placedDate: order.placedDate,
    approvedDate: order.approvedDate,
    grandTotal: order.grandTotal
  };

  // Return the updated order information in the defined response schema
  res.status(200).json(response);
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
